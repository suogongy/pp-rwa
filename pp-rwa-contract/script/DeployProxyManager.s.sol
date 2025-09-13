// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import "../src/RWAUpgradeableProxy.sol";

contract DeployProxyManager is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 部署管理合约
        RWAUpgradeableProxy proxyManager = new RWAUpgradeableProxy();
        console.log("ProxyManager deployed at:", address(proxyManager));
        
        vm.stopBroadcast();
    }
}