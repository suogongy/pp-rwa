// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {RWA20} from "../src/RWA20.sol";
import {RWAStaking} from "../src/RWAStaking.sol";

contract DeployRWAStaking is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts from address:", deployerAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Get existing RWA20 contract address or deploy new one
        address tokenAddress = vm.envAddress("RWA20_ADDRESS");
        RWA20 token;
        
        if (tokenAddress == address(0)) {
            console.log("No RWA20 address provided, deploying new RWA20 contract...");
            token = new RWA20("Real World Asset Token", "RWA", deployerAddress);
            tokenAddress = address(token);
            console.log("RWA20 deployed to:", tokenAddress);
        } else {
            console.log("Using existing RWA20 at:", tokenAddress);
            token = RWA20(tokenAddress);
        }
        
        // Deploy RWAStaking contract
        RWAStaking staking = new RWAStaking(tokenAddress, tokenAddress, deployerAddress);
        
        console.log("RWAStaking deployed to:");
        console.logAddress(address(staking));
        console.log("Staking Token Address:");
        console.logAddress(address(staking.stakingToken()));
        console.log("Reward Token Address:");
        console.logAddress(address(staking.rewardToken()));
        console.log("Owner:");
        console.logAddress(staking.owner());
        
        vm.stopBroadcast();
        
        // Log deployment info for easy integration
        console.log("\n=== Deployment Summary ===");
        console.logString("Network: local");
        console.logString("RWA20 Address: ");
        console.logAddress(tokenAddress);
        console.logString("RWAStaking Address: ");
        console.logAddress(address(staking));
        console.logString("Deployer: ");
        console.logAddress(deployerAddress);
        console.logString("Transaction Hash: ");
        console.logBytes32(bytes32(0)); // Placeholder for tx hash
    }
}