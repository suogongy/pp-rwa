// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {RWA20} from "../../src/RWA20.sol";
import {RWAStaking} from "../../src/RWAStaking.sol";

contract RWAStakingTest is Test {
    RWA20 public token;
    RWAStaking public staking;
    address public owner = address(0x1234);
    address public user1 = address(0x5678);
    address public user2 = address(0x9ABC);
    
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;
    uint256 public constant STAKING_AMOUNT = 1000 * 10**18;
    uint256 public constant REWARD_RATE = 100 * 10**18; // 100 tokens per day

    function setUp() public {
        vm.prank(owner);
        token = new RWA20("Real World Asset Token", "RWA", INITIAL_SUPPLY);
        
        vm.prank(owner);
        staking = new RWAStaking(address(token), REWARD_RATE);
        
        // Transfer tokens to users for testing
        vm.prank(owner);
        token.transfer(user1, 10000 * 10**18);
        vm.prank(owner);
        token.transfer(user2, 10000 * 10**18);
    }

    function test_InitialState() public view {
        assertEq(staking.token(), address(token));
        assertEq(staking.rewardRate(), REWARD_RATE);
        assertEq(staking.totalStaked(), 0);
        assertEq(staking.owner(), owner);
    }

    function test_Stake() public {
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        staking.stake(STAKING_AMOUNT);
        vm.stopPrank();
        
        assertEq(staking.totalStaked(), STAKING_AMOUNT);
        assertEq(staking.stakedAmount(user1), STAKING_AMOUNT);
        assertEq(token.balanceOf(user1), 10000 * 10**18 - STAKING_AMOUNT);
        assertEq(token.balanceOf(address(staking)), STAKING_AMOUNT);
    }

    function test_Unstake() public {
        // First stake
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        staking.stake(STAKING_AMOUNT);
        vm.stopPrank();
        
        // Then unstake
        vm.startPrank(user1);
        staking.unstake(STAKING_AMOUNT);
        vm.stopPrank();
        
        assertEq(staking.totalStaked(), 0);
        assertEq(staking.stakedAmount(user1), 0);
        assertEq(token.balanceOf(user1), 10000 * 10**18);
        assertEq(token.balanceOf(address(staking)), 0);
    }

    function test_ClaimRewards() public {
        // Stake
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        staking.stake(STAKING_AMOUNT);
        vm.stopPrank();
        
        // Advance time to earn rewards
        vm.warp(block.timestamp + 1 days);
        
        // Claim rewards
        uint256 balanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        staking.claimRewards();
        uint256 balanceAfter = token.balanceOf(user1);
        
        uint256 rewards = balanceAfter - balanceBefore;
        assertTrue(rewards > 0, "Should have earned rewards");
        
        // Rewards should be approximately REWARD_RATE
        assertApproxEqAbs(rewards, REWARD_RATE, REWARD_RATE / 100);
    }

    function test_CalculateRewards() public {
        // Stake
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        staking.stake(STAKING_AMOUNT);
        vm.stopPrank();
        
        // Advance time
        vm.warp(block.timestamp + 2 days);
        
        uint256 rewards = staking.calculateRewards(user1);
        
        // Rewards should be approximately 2 * REWARD_RATE
        assertApproxEqAbs(rewards, 2 * REWARD_RATE, REWARD_RATE / 100);
    }

    function test_MultipleUsersStaking() public {
        uint256 amount1 = 1000 * 10**18;
        uint256 amount2 = 2000 * 10**18;
        
        // Both users stake
        vm.startPrank(user1);
        token.approve(address(staking), amount1);
        staking.stake(amount1);
        vm.stopPrank();
        
        vm.startPrank(user2);
        token.approve(address(staking), amount2);
        staking.stake(amount2);
        vm.stopPrank();
        
        assertEq(staking.totalStaked(), amount1 + amount2);
        assertEq(staking.stakedAmount(user1), amount1);
        assertEq(staking.stakedAmount(user2), amount2);
    }

    function test_PartialUnstake() public {
        uint256 stakeAmount = 1000 * 10**18;
        uint256 unstakeAmount = 500 * 10**18;
        
        // Stake
        vm.startPrank(user1);
        token.approve(address(staking), stakeAmount);
        staking.stake(stakeAmount);
        vm.stopPrank();
        
        // Partial unstake
        vm.startPrank(user1);
        staking.unstake(unstakeAmount);
        vm.stopPrank();
        
        assertEq(staking.stakedAmount(user1), stakeAmount - unstakeAmount);
        assertEq(staking.totalStaked(), stakeAmount - unstakeAmount);
    }

    function test_EmergencyWithdraw() public {
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        staking.stake(STAKING_AMOUNT);
        vm.stopPrank();
        
        // Emergency withdraw by owner
        uint256 balanceBefore = token.balanceOf(owner);
        vm.prank(owner);
        staking.emergencyWithdraw(STAKING_AMOUNT);
        uint256 balanceAfter = token.balanceOf(owner);
        
        assertEq(balanceAfter - balanceBefore, STAKING_AMOUNT);
        assertEq(token.balanceOf(address(staking)), 0);
    }

    function test_SetRewardRate() public {
        uint256 newRate = 200 * 10**18;
        
        vm.prank(owner);
        staking.setRewardRate(newRate);
        
        assertEq(staking.rewardRate(), newRate);
    }

    function test_InsufficientBalance() public {
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        
        vm.expectRevert("ERC20: insufficient allowance");
        staking.stake(STAKING_AMOUNT * 2);
        
        vm.stopPrank();
    }

    function test_UnstakeMoreThanStaked() public {
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        staking.stake(STAKING_AMOUNT);
        
        vm.expectRevert("Insufficient staked amount");
        staking.unstake(STAKING_AMOUNT * 2);
        
        vm.stopPrank();
    }

    function test_NoRewardsToClaim() public {
        vm.expectRevert("No rewards to claim");
        vm.prank(user1);
        staking.claimRewards();
    }

    function test_OnlyOwnerSetRewardRate() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(user1);
        staking.setRewardRate(200 * 10**18);
    }

    function test_OnlyOwnerEmergencyWithdraw() public {
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        staking.stake(STAKING_AMOUNT);
        vm.stopPrank();
        
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(user1);
        staking.emergencyWithdraw(STAKING_AMOUNT);
    }

    function test_RewardsAccumulateOverTime() public {
        // Stake
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        staking.stake(STAKING_AMOUNT);
        vm.stopPrank();
        
        // Check initial rewards
        uint256 initialRewards = staking.calculateRewards(user1);
        assertEq(initialRewards, 0);
        
        // Advance time
        vm.warp(block.timestamp + 1 days);
        
        // Check rewards after 1 day
        uint256 day1Rewards = staking.calculateRewards(user1);
        assertTrue(day1Rewards > 0);
        
        // Advance more time
        vm.warp(block.timestamp + 1 days);
        
        // Check rewards after 2 days
        uint256 day2Rewards = staking.calculateRewards(user1);
        assertTrue(day2Rewards > day1Rewards);
    }

    function test_GasUsage() public {
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        
        uint256 gasStart = gasleft();
        staking.stake(STAKING_AMOUNT);
        uint256 gasUsed = gasStart - gasleft();
        
        console.log("Gas used for stake:", gasUsed);
        
        assertTrue(gasUsed < 200000, "Stake should use less than 200,000 gas");
        
        vm.stopPrank();
    }
}