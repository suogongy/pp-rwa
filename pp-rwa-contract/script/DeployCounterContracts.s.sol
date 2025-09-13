// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import "../src/RWAUpgradeableProxy.sol";
import "../src/CounterV1.sol";
import "../src/CounterV2.sol";

contract DeployCounterContracts is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 部署CounterV1
        CounterV1 counterV1 = new CounterV1();
        console.log("CounterV1 deployed at:", address(counterV1));
        
        // 部署CounterV2
        CounterV2 counterV2 = new CounterV2();
        console.log("CounterV2 deployed at:", address(counterV2));
        
        // 获取已部署的代理管理合约
        RWAUpgradeableProxy proxyManager = RWAUpgradeableProxy(0x21dF544947ba3E8b3c32561399E88B52Dc8b2823);
        
        // 创建CounterV1代理
        bytes memory initData = abi.encodeWithSignature("initialize()");
        address proxy = proxyManager.createProxy(address(counterV1), initData);
        console.log("CounterV1 proxy created at:", proxy);
        
        // 测试CounterV1功能
        CounterV1 counterProxy = CounterV1(proxy);
        console.log("Initial count:", counterProxy.getCount());
        
        // 调用next方法
        counterProxy.next();
        console.log("Count after next():", counterProxy.getCount());
        
        // 升级到CounterV2
        console.log("Upgrading to CounterV2...");
        proxyManager.upgrade(proxy, address(counterV2));
        
        // 检查版本信息
        uint256 version = proxyManager.getCurrentVersion(proxy);
        console.log("Current version after upgrade:", version);
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Complete ===");
        console.log("CounterV1:", address(counterV1));
        console.log("CounterV2:", address(counterV2));
        console.log("Proxy:", proxy);
        console.log("ProxyManager:", address(proxyManager));
        console.log("Upgrade completed successfully");
    }
}