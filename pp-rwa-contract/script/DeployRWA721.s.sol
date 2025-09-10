// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {RWA721} from "../src/RWA721.sol";

contract DeployRWA721 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts from address:", deployerAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy RWA721 contract
        RWA721 nft = new RWA721(
            "Real World Asset NFT",
            "RWA721",
            "http://127.0.0.1:8080/ipfs/QmVTQ3PhvEMwryZ1edi3Pa7ge7rq8EJAx89HKsju2185oz/",
            deployerAddress
        );

        console.log("RWA721 deployed to:");
        console.logAddress(address(nft));
        console.log("NFT Name:");
        console.logString(nft.name());
        console.log("NFT Symbol:");
        console.logString(nft.symbol());
        console.log("Owner:");
        console.logAddress(nft.owner());

        vm.stopBroadcast();

        // Log deployment info for easy integration
        console.log("\n=== Deployment Summary ===");
        console.logString("Network: local");
        console.logString("RWA721 Address: ");
        console.logAddress(address(nft));
        console.logString("Deployer: ");
        console.logAddress(deployerAddress);
        console.logString("Transaction Hash: ");
        console.logBytes32(bytes32(0)); // Placeholder for tx hash
    }
}
