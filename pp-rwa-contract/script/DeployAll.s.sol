// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {RWA20} from "../src/RWA20.sol";
import {RWA721} from "../src/RWA721.sol";
import {RWAStaking} from "../src/RWAStaking.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        console.log("Deploying all contracts from address:", deployerAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy RWA20 contract
        console.log("\n--- Deploying RWA20 ---");
        RWA20 token = new RWA20("Real World Asset Token", "RWA", deployerAddress);
        console.log("RWA20 deployed to:", address(token));
        
        // Deploy RWA721 contract
        console.log("\n--- Deploying RWA721 ---");
        RWA721 nft = new RWA721("Real World Asset NFT", "RWA721", "https://api.rwa.com/metadata/", deployerAddress);
        console.log("RWA721 deployed to:", address(nft));
        
        // Deploy RWAStaking contract
        console.log("\n--- Deploying RWAStaking ---");
        RWAStaking staking = new RWAStaking(address(token), address(token), deployerAddress);
        console.log("RWAStaking deployed to:", address(staking));
        
        // Mint NFT for testing
        console.log("\n--- Minting Test NFT ---");
        nft.mintNFT(deployerAddress, "https://example.com/nft/1");
        console.log("Minted NFT #1 to deployer");
        
        vm.stopBroadcast();
        
        // Log deployment info for easy integration
        console.log("\n=== Complete Deployment Summary ===");
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
        console.log("\n=== Environment Variables ===");
        console.logString("NEXT_PUBLIC_RWA20_ADDRESS=");
        console.logAddress(address(token));
        console.logString("NEXT_PUBLIC_RWA721_ADDRESS=");
        console.logAddress(address(nft));
        console.logString("NEXT_PUBLIC_STAKING_ADDRESS=");
        console.logAddress(address(staking));
    }
}