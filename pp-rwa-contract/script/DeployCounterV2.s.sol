// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {CounterV2} from "../src/CounterV2.sol";
import {RWAUpgradeableProxy} from "../src/RWAUpgradeableProxy.sol";

/**
 * @title DeployCounterV2
 * @dev 部署CounterV2合约和升级代理的脚本
 */
contract DeployCounterV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        // 需要已部署的代理地址
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Upgrading proxy from:", deployerAddress);
        console.log("Target proxy:", proxyAddress);
        
        // 1. Deploy CounterV2 implementation
        CounterV2 counterV2 = new CounterV2();
        console.log("CounterV2 implementation deployed at:", address(counterV2));
        
        // 2. Get proxy manager
        RWAUpgradeableProxy proxyManager = RWAUpgradeableProxy(vm.envAddress("PROXY_MANAGER_ADDRESS"));
        console.log("Using ProxyManager:", address(proxyManager));
        
        // 3. Upgrade proxy to CounterV2
        proxyManager.upgrade(proxyAddress, address(counterV2));
        console.log("Proxy upgraded to CounterV2");
        
        // 4. Initialize V2 new state variables
        CounterV2 proxy = CounterV2(proxyAddress);
        proxy.initializeV2();
        console.log("V2 state initialized");
        
        // 5. Verify upgrade
        console.log("Current version:", proxyManager.getCurrentVersion(proxyAddress));
        console.log("Current count:", proxy.getCount());
        console.log("v2Prop value:", proxy.getV2Prop());
        
        vm.stopBroadcast();
        
        console.log("\n=== Upgrade Summary ===");
        console.log("ProxyManager:", address(proxyManager));
        console.log("CounterV2 Implementation:", address(counterV2));
        console.log("Proxy Address:", proxyAddress);
        console.log("New Version:", proxyManager.getCurrentVersion(proxyAddress));
    }
}