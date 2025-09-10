// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {RWA20} from "../src/RWA20.sol";
import {RWAStaking} from "../src/RWAStaking.sol";

contract RWAStakingTest is Test {
    RWA20 public token;
    RWAStaking public staking;
    address public owner = address(0x1234);
    address public user1 = address(0x5678);
    address public user2 = address(0x9ABC);

    uint256 public constant INITIAL_SUPPLY = 1000000 * 10 ** 18;
    uint256 public constant STAKING_AMOUNT = 1000 * 10 ** 18;

    function setUp() public {
        vm.prank(owner);
        token = new RWA20("Real World Asset Token", "RWA", owner);

        vm.prank(owner);
        staking = new RWAStaking(address(token), address(token), owner);

        // Transfer tokens to users for testing
        vm.prank(owner);
        token.transfer(user1, 10000 * 10 ** 18);
        vm.prank(owner);
        token.transfer(user2, 10000 * 10 ** 18);
    }

    function test_InitialState() public view {
        assertEq(address(staking.stakingToken()), address(token));
        assertEq(address(staking.rewardToken()), address(token));
        assertEq(staking.totalStaked(), 0);
        assertEq(staking.owner(), owner);
    }

    function test_Stake() public {
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        bytes32 stakeId = staking.stake(STAKING_AMOUNT, 0);
        vm.stopPrank();

        assertEq(staking.totalStaked(), STAKING_AMOUNT);
        assertEq(token.balanceOf(user1), 10000 * 10 ** 18 - STAKING_AMOUNT);
        assertEq(token.balanceOf(address(staking)), STAKING_AMOUNT);
    }

    function test_Unstake() public {
        // First stake
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        bytes32 stakeId = staking.stake(STAKING_AMOUNT, 0);
        uint256 balanceBeforeStake = token.balanceOf(user1);
        vm.stopPrank();

        // Give contract some reward tokens
        vm.prank(owner);
        token.transfer(address(staking), STAKING_AMOUNT);

        // Skip time to unlock
        vm.warp(block.timestamp + 31 days);

        // Then unstake
        vm.startPrank(user1);
        uint256 balanceBeforeUnstake = token.balanceOf(user1);
        staking.unstake(stakeId);
        uint256 balanceAfterUnstake = token.balanceOf(user1);
        vm.stopPrank();

        assertEq(staking.totalStaked(), 0);
        // User should have their original staked amount back plus any rewards
        assertTrue(balanceAfterUnstake >= balanceBeforeStake);
        // Contract should only have remaining reward tokens (not staked tokens)
        assertTrue(token.balanceOf(address(staking)) < STAKING_AMOUNT);
    }

    function test_ClaimRewards() public {
        // Stake
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        bytes32 stakeId = staking.stake(STAKING_AMOUNT, 0);
        vm.stopPrank();

        // Advance time to earn rewards
        vm.warp(block.timestamp + 1 days);

        // Claim rewards
        uint256 balanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        staking.claimRewards(stakeId);
        uint256 balanceAfter = token.balanceOf(user1);

        uint256 rewards = balanceAfter - balanceBefore;
        assertTrue(rewards > 0, "Should have earned rewards");
    }

    function test_CalculateRewards() public {
        // Stake
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        bytes32 stakeId = staking.stake(STAKING_AMOUNT, 0);
        vm.stopPrank();

        // Advance time
        vm.warp(block.timestamp + 2 days);

        uint256 rewards = staking.calculatePendingRewards(stakeId);

        // Rewards should be greater than 0
        assertTrue(rewards > 0, "Should have earned rewards");
    }

    function test_MultipleUsersStaking() public {
        uint256 amount1 = 1000 * 10 ** 18;
        uint256 amount2 = 2000 * 10 ** 18;

        // Both users stake
        vm.startPrank(user1);
        token.approve(address(staking), amount1);
        staking.stake(amount1, 0);
        vm.stopPrank();

        vm.startPrank(user2);
        token.approve(address(staking), amount2);
        staking.stake(amount2, 0);
        vm.stopPrank();

        assertEq(staking.totalStaked(), amount1 + amount2);
    }

    function test_PartialUnstake() public {
        // Stake first amount
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        bytes32 stakeId1 = staking.stake(STAKING_AMOUNT, 0);

        // Stake second amount
        token.approve(address(staking), STAKING_AMOUNT);
        bytes32 stakeId2 = staking.stake(STAKING_AMOUNT, 0);
        vm.stopPrank();

        // Skip time to unlock
        vm.warp(block.timestamp + 31 days);

        // Unstake one of the stakes
        vm.startPrank(user1);
        staking.unstake(stakeId1);
        vm.stopPrank();

        assertEq(staking.totalStaked(), STAKING_AMOUNT);
    }

    function test_EmergencyWithdraw() public {
        // Transfer some extra tokens to contract first
        vm.prank(owner);
        token.transfer(address(staking), STAKING_AMOUNT);

        // Pause contract first
        vm.prank(owner);
        staking.pause();

        // Emergency withdraw by owner
        uint256 balanceBefore = token.balanceOf(owner);
        vm.prank(owner);
        staking.emergencyWithdraw(address(token), STAKING_AMOUNT);
        uint256 balanceAfter = token.balanceOf(owner);

        assertEq(balanceAfter - balanceBefore, STAKING_AMOUNT);
    }

    function test_SetRewardRate() public {
        uint256 newRate = 2000; // 20% in basis points

        vm.prank(owner);
        staking.updateBaseRewardRate(newRate);

        assertEq(staking.baseRewardRate(), newRate);
    }

    function test_InsufficientBalance() public {
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);

        vm.expectRevert(
            "ERC20InsufficientAllowance(0x79d9A6d750690dba4E2F862f38b712188E3E567D, 1000000000000000000000 [1e21], 2000000000000000000000 [2e21])"
        );
        staking.stake(STAKING_AMOUNT * 2, 0);

        vm.stopPrank();
    }

    function test_UnstakeMoreThanStaked() public {
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        bytes32 stakeId = staking.stake(STAKING_AMOUNT, 0);
        vm.stopPrank();

        vm.warp(block.timestamp + 31 days);

        vm.startPrank(user1);
        vm.expectRevert("RWAStaking: stake not active");
        staking.unstake(bytes32(0)); // invalid stake ID
        vm.stopPrank();
    }

    function test_NoRewardsToClaim() public {
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        bytes32 stakeId = staking.stake(STAKING_AMOUNT, 0);
        vm.stopPrank();

        vm.expectRevert("RWAStaking: no rewards to claim");
        vm.prank(user1);
        staking.claimRewards(stakeId);
    }

    function test_OnlyOwnerSetRewardRate() public {
        vm.expectRevert("OwnableUnauthorizedAccount(0x0000000000000000000000000000000000005678)");
        vm.prank(user1);
        staking.updateBaseRewardRate(2000);
    }

    function test_OnlyOwnerEmergencyWithdraw() public {
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        staking.stake(STAKING_AMOUNT, 0);
        vm.stopPrank();

        vm.prank(owner);
        staking.pause();

        vm.expectRevert("OwnableUnauthorizedAccount(0x0000000000000000000000000000000000005678)");
        vm.prank(user1);
        staking.emergencyWithdraw(address(token), STAKING_AMOUNT);
    }

    function test_RewardsAccumulateOverTime() public {
        // Stake
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);
        bytes32 stakeId = staking.stake(STAKING_AMOUNT, 0);
        vm.stopPrank();

        // Check initial rewards
        uint256 initialRewards = staking.calculatePendingRewards(stakeId);
        assertEq(initialRewards, 0);

        // Advance time
        vm.warp(block.timestamp + 1 days);

        // Check rewards after 1 day
        uint256 day1Rewards = staking.calculatePendingRewards(stakeId);
        assertTrue(day1Rewards > 0);

        // Advance more time
        vm.warp(block.timestamp + 1 days);

        // Check rewards after 2 days
        uint256 day2Rewards = staking.calculatePendingRewards(stakeId);
        assertTrue(day2Rewards > day1Rewards);
    }

    function test_GasUsage() public {
        vm.startPrank(user1);
        token.approve(address(staking), STAKING_AMOUNT);

        uint256 gasStart = gasleft();
        staking.stake(STAKING_AMOUNT, 0);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas used for stake:", gasUsed);

        assertTrue(gasUsed < 400000, "Stake should use less than 400,000 gas");

        vm.stopPrank();
    }
}
