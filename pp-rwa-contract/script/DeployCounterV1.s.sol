// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {CounterV1} from "../src/CounterV1.sol";

/**
 * @title DeployCounterV1
 * @dev 部署CounterV1合约
 */
contract DeployCounterV1 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying CounterV1 from:", deployerAddress);
        
        // Deploy CounterV1 implementation
        CounterV1 counterV1 = new CounterV1();
        console.log("CounterV1 deployed at:", address(counterV1));
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("CounterV1 Address:", address(counterV1));
        console.log("export COUNTER_V1_ADDRESS=", address(counterV1));
    }
}