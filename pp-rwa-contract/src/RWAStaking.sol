// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RWAStaking
 * @dev Staking contract for RWA tokens with reward distribution
 *
 * Features:
 * 1. Flexible Staking - Multiple staking periods
 * 2. Dynamic Rewards - Adjustable reward rates
 * 3. Compound Interest - Automatic compounding option
 * 4. Security - Comprehensive security measures
 * 5. Transparency - Detailed staking information
 */
contract RWAStaking is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Events
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod, uint256 rewardRate, bytes32 indexed stakeId);
    event Unstaked(address indexed user, uint256 amount, uint256 reward, bytes32 indexed stakeId);
    event RewardClaimed(address indexed user, uint256 amount, bytes32 indexed stakeId);
    event Compounded(address indexed user, uint256 additionalAmount, uint256 newRewardRate, bytes32 indexed stakeId);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event StakingPeriodUpdated(
        uint256 periodId, uint256 oldDuration, uint256 newDuration, uint256 oldMultiplier, uint256 newMultiplier
    );

    // Staking info structure
    struct StakeInfo {
        address user;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 rewardRate;
        uint256 lockPeriod;
        uint256 rewardMultiplier;
        uint256 lastRewardTime;
        uint256 claimedRewards;
        bool isActive;
        bool isCompounded;
    }

    // Staking period configuration
    struct StakingPeriod {
        uint256 duration; // in seconds
        uint256 rewardMultiplier; // in basis points (100 = 1x)
        bool isActive;
    }

    // State variables
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    // Mapping for user stakes
    mapping(bytes32 => StakeInfo) public stakes;
    mapping(address => bytes32[]) public userStakes;

    // Staking periods
    StakingPeriod[] public stakingPeriods;

    // Contract parameters
    uint256 public baseRewardRate; // in basis points per year (1000 = 10%)
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;

    // Constants
    uint256 private constant SECONDS_PER_YEAR = 31536000; // 365 days
    uint256 private constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    uint256 private constant MAX_REWARD_RATE = 5000; // 50% max reward rate
    uint256 private constant MAX_MULTIPLIER = 500; // 5x max multiplier

    /**
     * @dev Constructor
     * @param stakingTokenAddress Address of staking token
     * @param rewardTokenAddress Address of reward token
     * @param initialOwner Contract owner
     */
    constructor(address stakingTokenAddress, address rewardTokenAddress, address initialOwner) Ownable(initialOwner) {
        require(stakingTokenAddress != address(0), "RWAStaking: invalid staking token address");
        require(rewardTokenAddress != address(0), "RWAStaking: invalid reward token address");

        stakingToken = IERC20(stakingTokenAddress);
        rewardToken = IERC20(rewardTokenAddress);

        baseRewardRate = 1000; // 10% base reward rate

        // Initialize default staking periods
        stakingPeriods.push(
            StakingPeriod({
                duration: 30 days, // 30 days
                rewardMultiplier: 110, // 1.1x multiplier
                isActive: true
            })
        );

        stakingPeriods.push(
            StakingPeriod({
                duration: 90 days, // 90 days
                rewardMultiplier: 125, // 1.25x multiplier
                isActive: true
            })
        );

        stakingPeriods.push(
            StakingPeriod({
                duration: 180 days, // 180 days
                rewardMultiplier: 150, // 1.5x multiplier
                isActive: true
            })
        );

        stakingPeriods.push(
            StakingPeriod({
                duration: 365 days, // 365 days
                rewardMultiplier: 200, // 2x multiplier
                isActive: true
            })
        );
    }

    /**
     * @dev Stake tokens
     * @param amount Amount to stake
     * @param periodId Staking period ID
     * @return stakeId Unique stake identifier
     */
    function stake(uint256 amount, uint256 periodId) public whenNotPaused nonReentrant returns (bytes32) {
        require(amount > 0, "RWAStaking: amount must be positive");
        require(periodId < stakingPeriods.length, "RWAStaking: invalid period ID");
        require(stakingPeriods[periodId].isActive, "RWAStaking: period not active");

        // Transfer tokens from user
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Calculate reward rate
        uint256 rewardRate = (baseRewardRate * stakingPeriods[periodId].rewardMultiplier) / BASIS_POINTS;

        // Generate stake ID
        bytes32 stakeId =
            keccak256(abi.encodePacked(msg.sender, amount, block.timestamp, periodId, userStakes[msg.sender].length));

        // Create stake record
        stakes[stakeId] = StakeInfo({
            user: msg.sender,
            amount: amount,
            startTime: block.timestamp,
            endTime: block.timestamp + stakingPeriods[periodId].duration,
            rewardRate: rewardRate,
            lockPeriod: stakingPeriods[periodId].duration,
            rewardMultiplier: stakingPeriods[periodId].rewardMultiplier,
            lastRewardTime: block.timestamp,
            claimedRewards: 0,
            isActive: true,
            isCompounded: false
        });

        // Add to user stakes
        userStakes[msg.sender].push(stakeId);

        // Update totals
        totalStaked += amount;

        emit Staked(msg.sender, amount, stakingPeriods[periodId].duration, rewardRate, stakeId);

        return stakeId;
    }

    /**
     * @dev Unstake tokens and claim rewards
     * @param stakeId Stake ID to unstake
     */
    function unstake(bytes32 stakeId) public whenNotPaused nonReentrant {
        StakeInfo storage stake = stakes[stakeId];

        require(stake.isActive, "RWAStaking: stake not active");
        require(stake.user == msg.sender, "RWAStaking: not stake owner");
        require(block.timestamp >= stake.endTime, "RWAStaking: stake still locked");

        // Calculate pending rewards
        uint256 pendingRewards = calculatePendingRewards(stakeId);

        // Update stake status
        stake.isActive = false;

        // Update totals
        totalStaked -= stake.amount;
        totalRewardsDistributed += pendingRewards;

        // Transfer staked amount back to user
        stakingToken.safeTransfer(msg.sender, stake.amount);

        // Transfer rewards if any
        if (pendingRewards > 0) {
            rewardToken.safeTransfer(msg.sender, pendingRewards);
        }

        emit Unstaked(msg.sender, stake.amount, pendingRewards, stakeId);
    }

    /**
     * @dev Claim rewards from a stake
     * @param stakeId Stake ID to claim rewards from
     */
    function claimRewards(bytes32 stakeId) public whenNotPaused nonReentrant {
        StakeInfo storage stake = stakes[stakeId];

        require(stake.isActive, "RWAStaking: stake not active");
        require(stake.user == msg.sender, "RWAStaking: not stake owner");

        // Calculate pending rewards
        uint256 pendingRewards = calculatePendingRewards(stakeId);

        require(pendingRewards > 0, "RWAStaking: no rewards to claim");

        // Update stake
        stake.lastRewardTime = block.timestamp;
        stake.claimedRewards += pendingRewards;

        // Update totals
        totalRewardsDistributed += pendingRewards;

        // Transfer rewards
        rewardToken.safeTransfer(msg.sender, pendingRewards);

        emit RewardClaimed(msg.sender, pendingRewards, stakeId);
    }

    /**
     * @dev Compound staking (add more tokens to existing stake)
     * @param stakeId Stake ID to compound
     * @param additionalAmount Additional amount to stake
     */
    function compoundStake(bytes32 stakeId, uint256 additionalAmount) public whenNotPaused nonReentrant {
        StakeInfo storage stake = stakes[stakeId];

        require(stake.isActive, "RWAStaking: stake not active");
        require(stake.user == msg.sender, "RWAStaking: not stake owner");
        require(additionalAmount > 0, "RWAStaking: amount must be positive");
        require(block.timestamp < stake.endTime, "RWAStaking: stake already expired");

        // Calculate pending rewards first
        uint256 pendingRewards = calculatePendingRewards(stakeId);

        // Transfer additional tokens
        stakingToken.safeTransferFrom(msg.sender, address(this), additionalAmount);

        // Update stake amount
        stake.amount += additionalAmount;
        stake.lastRewardTime = block.timestamp;
        stake.isCompounded = true;

        // Update totals
        totalStaked += additionalAmount;

        // Auto-claim pending rewards
        if (pendingRewards > 0) {
            stake.claimedRewards += pendingRewards;
            totalRewardsDistributed += pendingRewards;
            rewardToken.safeTransfer(msg.sender, pendingRewards);
        }

        emit Compounded(msg.sender, additionalAmount, stake.rewardRate, stakeId);
    }

    /**
     * @dev Calculate pending rewards for a stake
     * @param stakeId Stake ID
     * @return Pending reward amount
     */
    function calculatePendingRewards(bytes32 stakeId) public view returns (uint256) {
        StakeInfo storage stake = stakes[stakeId];

        if (!stake.isActive) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - stake.lastRewardTime;
        uint256 maxTime = stake.endTime - stake.startTime;
        uint256 actualTime = timeElapsed > maxTime ? maxTime : timeElapsed;

        // Calculate rewards: (amount * rewardRate * timeElapsed) / (SECONDS_PER_YEAR * BASIS_POINTS)
        uint256 rewards = (stake.amount * stake.rewardRate * actualTime) / (SECONDS_PER_YEAR * BASIS_POINTS);

        return rewards;
    }

    /**
     * @dev Get stake information
     * @param stakeId Stake ID
     * @return user Stake owner address
     * @return amount Staked amount
     * @return startTime Stake start time
     * @return endTime Stake end time
     * @return rewardRate Reward rate
     * @return lockPeriod Lock period
     * @return rewardMultiplier Reward multiplier
     * @return lastRewardTime Last reward time
     * @return claimedRewards Claimed rewards
     * @return isActive Stake active status
     * @return isCompounded Compound status
     * @return pendingRewards Pending rewards
     */
    function getStakeInfo(bytes32 stakeId)
        public
        view
        returns (
            address user,
            uint256 amount,
            uint256 startTime,
            uint256 endTime,
            uint256 rewardRate,
            uint256 lockPeriod,
            uint256 rewardMultiplier,
            uint256 lastRewardTime,
            uint256 claimedRewards,
            bool isActive,
            bool isCompounded,
            uint256 pendingRewards
        )
    {
        StakeInfo storage stake = stakes[stakeId];
        pendingRewards = calculatePendingRewards(stakeId);

        return (
            stake.user,
            stake.amount,
            stake.startTime,
            stake.endTime,
            stake.rewardRate,
            stake.lockPeriod,
            stake.rewardMultiplier,
            stake.lastRewardTime,
            stake.claimedRewards,
            stake.isActive,
            stake.isCompounded,
            pendingRewards
        );
    }

    /**
     * @dev Get user's stakes
     * @param user User address
     * @return Array of stake IDs
     */
    function getUserStakes(address user) public view returns (bytes32[] memory) {
        return userStakes[user];
    }

    /**
     * @dev Calculate APY for a staking period
     * @param periodId Period ID
     * @return APY in basis points
     */
    function calculateAPY(uint256 periodId) public view returns (uint256) {
        require(periodId < stakingPeriods.length, "RWAStaking: invalid period ID");

        StakingPeriod storage period = stakingPeriods[periodId];
        return (baseRewardRate * period.rewardMultiplier) / BASIS_POINTS;
    }

    /**
     * @dev Update base reward rate
     * @param newRate New reward rate in basis points
     */
    function updateBaseRewardRate(uint256 newRate) public onlyOwner whenNotPaused {
        require(newRate <= MAX_REWARD_RATE, "RWAStaking: reward rate too high");

        uint256 oldRate = baseRewardRate;
        baseRewardRate = newRate;

        emit RewardRateUpdated(oldRate, newRate);
    }

    /**
     * @dev Update staking period
     * @param periodId Period ID
     * @param newDuration New duration in seconds
     * @param newMultiplier New multiplier in basis points
     */
    function updateStakingPeriod(uint256 periodId, uint256 newDuration, uint256 newMultiplier)
        public
        onlyOwner
        whenNotPaused
    {
        require(periodId < stakingPeriods.length, "RWAStaking: invalid period ID");
        require(newDuration > 0, "RWAStaking: duration must be positive");
        require(newMultiplier <= MAX_MULTIPLIER * 100, "RWAStaking: multiplier too high");

        StakingPeriod storage period = stakingPeriods[periodId];

        emit StakingPeriodUpdated(periodId, period.duration, newDuration, period.rewardMultiplier, newMultiplier);

        period.duration = newDuration;
        period.rewardMultiplier = newMultiplier;
    }

    /**
     * @dev Toggle staking period activity
     * @param periodId Period ID
     * @param isActive Activity status
     */
    function toggleStakingPeriod(uint256 periodId, bool isActive) public onlyOwner whenNotPaused {
        require(periodId < stakingPeriods.length, "RWAStaking: invalid period ID");

        stakingPeriods[periodId].isActive = isActive;
    }

    /**
     * @dev Emergency withdraw tokens (owner only)
     * @param tokenAddress Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address tokenAddress, uint256 amount) public onlyOwner whenPaused {
        require(tokenAddress != address(0), "RWAStaking: invalid token address");

        if (tokenAddress == address(stakingToken)) {
            require(
                amount <= stakingToken.balanceOf(address(this)) - totalStaked,
                "RWAStaking: cannot withdraw staked tokens"
            );
        }

        IERC20(tokenAddress).safeTransfer(owner(), amount);
    }

    /**
     * @dev Pause contract
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Get contract information
     * @return stakingTokenAddress Staking token address
     * @return rewardTokenAddress Reward token address
     * @return contractOwner Contract owner address
     * @return currentBaseRewardRate Current base reward rate
     * @return totalAmountStaked Total staked amount
     * @return totalRewardsPaid Total rewards paid
     * @return isPaused Contract pause status
     * @return activeStakingPeriods Number of active staking periods
     */
    function contractInfo()
        public
        view
        returns (
            address stakingTokenAddress,
            address rewardTokenAddress,
            address contractOwner,
            uint256 currentBaseRewardRate,
            uint256 totalAmountStaked,
            uint256 totalRewardsPaid,
            bool isPaused,
            uint256 activeStakingPeriods
        )
    {
        // Count active periods
        uint256 activeCount = 0;
        for (uint256 i = 0; i < stakingPeriods.length; i++) {
            if (stakingPeriods[i].isActive) {
                activeCount++;
            }
        }

        return (
            address(stakingToken),
            address(rewardToken),
            owner(),
            baseRewardRate,
            totalStaked,
            totalRewardsDistributed,
            paused(),
            activeCount
        );
    }
}
