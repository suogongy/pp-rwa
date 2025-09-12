// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {CounterV2} from "../src/CounterV2.sol";

/**
 * @title DeployCounterV2
 * @dev 部署CounterV2合约
 */
contract DeployCounterV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying CounterV2 from:", deployerAddress);
        
        // Deploy CounterV2 implementation
        CounterV2 counterV2 = new CounterV2();
        console.log("CounterV2 deployed at:", address(counterV2));
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("CounterV2 Address:", address(counterV2));
        console.log("export COUNTER_V2_ADDRESS=", address(counterV2));
    }
}