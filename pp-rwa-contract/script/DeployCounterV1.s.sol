// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {CounterV1} from "../src/CounterV1.sol";
import {RWAUpgradeableProxy} from "../src/RWAUpgradeableProxy.sol";

/**
 * @title DeployCounterV1
 * @dev 部署CounterV1合约和代理的脚本
 */
contract DeployCounterV1 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying contracts from:", deployerAddress);
        
        // 1. Deploy RWAUpgradeableProxy
        RWAUpgradeableProxy proxyManager = new RWAUpgradeableProxy();
        console.log("RWAUpgradeableProxy deployed at:", address(proxyManager));
        
        // 2. Deploy CounterV1 implementation
        CounterV1 counterV1 = new CounterV1();
        console.log("CounterV1 implementation deployed at:", address(counterV1));
        
        // 3. Create proxy with CounterV1
        bytes memory initData = abi.encodeWithSelector(CounterV1.initialize.selector);
        address proxyAddress = proxyManager.createProxy(address(counterV1), initData);
        console.log("CounterV1 proxy deployed at:", proxyAddress);
        
        // 4. Verify deployment
        CounterV1 proxy = CounterV1(proxyAddress);
        console.log("Initial count:", proxy.getCount());
        console.log("Proxy owner:", proxy.owner());
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("ProxyManager:", address(proxyManager));
        console.log("CounterV1 Implementation:", address(counterV1));
        console.log("CounterV1 Proxy:", proxyAddress);
        console.log("Current Version:", proxyManager.getCurrentVersion(proxyAddress));
    }
}