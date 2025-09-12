// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/RWAUpgradeableProxy.sol";

/**
 * @title DeployRWAUpgradeableProxy
 * @dev 部署RWA可升级代理合约
 */
contract DeployRWAUpgradeableProxy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== Deploying RWA Upgradeable Proxy ===");
        console.log("Deployer address:", deployer);
        
        // Deploy proxy factory contract
        RWAUpgradeableProxy proxyFactory = new RWAUpgradeableProxy();
        
        console.log("Proxy factory deployed at:", address(proxyFactory));
        console.log("Proxy factory owner:", proxyFactory.owner());
        
        vm.stopBroadcast();
        
        console.log("\n=== Verification Commands ===");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200 ", address(proxyFactory), "src/RWAUpgradeableProxy.sol:RWAUpgradeableProxy");
        
        console.log("\n=== Environment Variables Configuration ===");
        console.log("export PROXY_FACTORY_ADDRESS=", address(proxyFactory));
    }
}