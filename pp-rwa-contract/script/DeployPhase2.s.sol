// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {RWA20} from "../src/RWA20.sol";
import {RWA721} from "../src/RWA721.sol";
import {RWAStaking} from "../src/RWAStaking.sol";

/**
 * @title DeployPhase2
 * @dev RWA项目第二阶段部署脚本
 * 部署内容包括：
 * - RWA20: ERC-20代币合约（第一阶段核心）
 * - RWA721: ERC-721 NFT合约（第二阶段新增）
 * - RWAStaking: 代币质押合约（第二阶段新增）
 * 本脚本整合了前两个阶段的核心合约部署
 */
contract DeployPhase2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        require(deployerPrivateKey != 0, "PRIVATE_KEY not set in env");
        address deployerAddress = vm.addr(deployerPrivateKey);

        console.log("=== RWA Phase 2 Deployment ===");
        console.log("Deploying Phase 2 contracts from address:", deployerAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy RWA20 contract
        console.log("\n--- Deploying RWA20 ---");
        RWA20 token = new RWA20("Real World Asset Token", "RWA", deployerAddress);
        console.log("RWA20 deployed to:", address(token));

        // Deploy RWA721 contract
        console.log("\n--- Deploying RWA721 ---");
        
        RWA721 nft = new RWA721(
            "Real World Asset NFT",
            "RWA721",
            "http://127.0.0.1:8080/ipfs/QmVTQ3PhvEMwryZ1edi3Pa7ge7rq8EJAx89HKsju2185oz/",
            deployerAddress
        );
        console.log("RWA721 deployed to:", address(nft));

        // Deploy RWAStaking contract
        console.log("\n--- Deploying RWAStaking ---");
        RWAStaking staking = new RWAStaking(address(token), address(token), deployerAddress);
        console.log("RWAStaking deployed to:", address(staking));

        vm.stopBroadcast();

        // Log deployment info for easy integration
        console.log("\n=== Phase 2 Deployment Summary ===");
        console.logString("Network: local");
        console.logString("Deployer: ");
        console.logAddress(deployerAddress);
        console.logString("RWA20 Address: ");
        console.logAddress(address(token));
        console.logString("RWA721 Address: ");
        console.logAddress(address(nft));
        console.logString("RWAStaking Address: ");
        console.logAddress(address(staking));
        console.logString("Transaction Hash: ");
        console.logBytes32(bytes32(0)); // Placeholder for tx hash

        // Environment variables for frontend integration
        console.log("\n=== Phase 2 Environment Variables ===");
        console.logString("NEXT_PUBLIC_RWA20_ADDRESS=");
        console.logAddress(address(token));
        console.logString("NEXT_PUBLIC_RWA721_ADDRESS=");
        console.logAddress(address(nft));
        console.logString("NEXT_PUBLIC_STAKING_ADDRESS=");
        console.logAddress(address(staking));
    }
}
