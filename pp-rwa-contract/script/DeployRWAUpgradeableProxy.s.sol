// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/RWAUpgradeableProxy.sol";

/**
 * @title DeployRWAUpgradeableProxy
 * @dev RWA可升级代理独立部署脚本
 * 部署透明代理模式的可升级合约系统
 */
contract DeployRWAUpgradeableProxy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== RWA Upgradeable Proxy Deployment ===");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        // Deploy proxy factory contract
        RWAUpgradeableProxy proxyFactory = new RWAUpgradeableProxy();
        
        console.log("Proxy factory deployed at:", address(proxyFactory));
        console.log("Proxy factory owner:", proxyFactory.owner());
        
        // Example: Create proxy for RWA20 token
        console.log("\n=== Example: Creating RWA20 Token Proxy ===");
        
        // TODO: Get RWA20 implementation contract address from environment variables
        address rwa20Implementation = vm.envOr("RWA20_IMPLEMENTATION_ADDRESS", address(0));
        
        if (rwa20Implementation == address(0)) {
            console.log("Warning: RWA20 implementation address not configured, skipping proxy creation");
            console.log("Please set before deployment: export RWA20_IMPLEMENTATION_ADDRESS=0x...");
        } else {
            // Create RWA20 token initialization data
            bytes memory initData = abi.encodeWithSignature("initialize(string,string,address)", "RWA Token Proxied", "RWA-P", deployer);
            
            // Create proxy contract
            address rwa20Proxy = proxyFactory.createProxy(rwa20Implementation, initData);
            
            console.log("RWA20 proxy contract address:", rwa20Proxy);
            console.log("RWA20 implementation contract address:", rwa20Implementation);
            console.log("RWA20 proxy version:", proxyFactory.getCurrentVersion(rwa20Proxy));
            
            // Verify proxy configuration
            bool isProxyValid = proxyFactory.isProxy(rwa20Proxy);
            address currentImplementation = proxyFactory.implementation(rwa20Proxy);
            
            console.log("Proxy validity:", isProxyValid ? "Valid" : "Invalid");
            console.log("Current implementation contract:", currentImplementation);
        }
        
        // Example: Create proxy for governance contract
        console.log("\n=== Example: Creating Governance Contract Proxy ===");
        
        // TODO: Get governance contract implementation address from environment variables
        address governorImplementation = vm.envOr("GOVERNOR_IMPLEMENTATION_ADDRESS", address(0));
        
        if (governorImplementation == address(0)) {
            console.log("Warning: Governance contract implementation address not configured, skipping proxy creation");
            console.log("Please set before deployment: export GOVERNOR_IMPLEMENTATION_ADDRESS=0x...");
        } else {
            // 创建治理合约的初始化数据（需要治理代币地址）
            address governanceToken = vm.envOr("GOVERNANCE_TOKEN_ADDRESS", address(0));
            
            if (governanceToken == address(0)) {
                console.log("Warning: Governance token address not configured, cannot create governance proxy");
            } else {
                bytes memory governorInitData = abi.encodeWithSignature(
                    "initialize(address)",
                    governanceToken
                );
                
                address governorProxy = proxyFactory.createProxy(governorImplementation, governorInitData);
                
                console.log("Governance proxy contract address:", governorProxy);
                console.log("Governance implementation contract address:", governorImplementation);
                console.log("Governance proxy version:", proxyFactory.getCurrentVersion(governorProxy));
            }
        }
        
        // Example: Create proxy for multisig wallet
        console.log("\n=== Example: Creating Multisig Wallet Proxy ===");
        
        // TODO: Get multisig wallet implementation address from environment variables
        address multisigImplementation = vm.envOr("MULTISIG_IMPLEMENTATION_ADDRESS", address(0));
        
        if (multisigImplementation == address(0)) {
            console.log("Warning: Multisig wallet implementation address not configured, skipping proxy creation");
            console.log("Please set before deployment: export MULTISIG_IMPLEMENTATION_ADDRESS=0x...");
        } else {
            // Create multisig wallet initialization data (requires signer list and threshold)
            address[] memory initialSigners = new address[](2);
            initialSigners[0] = deployer;
            initialSigners[1] = address(0xa0Ee7A142d267C1f36714E4a8F75612F20a79720); // Test address
            
            bytes memory multisigInitData = abi.encodeWithSignature(
                "initialize(address[],uint256)",
                initialSigners,
                2 // 2-of-2 multisig
            );
            
            address multisigProxy = proxyFactory.createProxy(multisigImplementation, multisigInitData);
            
            console.log("Multisig proxy contract address:", multisigProxy);
            console.log("Multisig implementation contract address:", multisigImplementation);
            console.log("Multisig proxy version:", proxyFactory.getCurrentVersion(multisigProxy));
        }
        
        // Display current proxy statistics
        console.log("\n=== Proxy Statistics ===");
        uint256 proxyCount = proxyFactory.getProxyCount();
        console.log("Created proxies count:", proxyCount);
        
        if (proxyCount > 0) {
            console.log("\nProxy contract list:");
            for (uint256 i = 0; i < proxyCount; i++) {
                address proxyAddr = proxyFactory.proxyAddresses(i);
                address implementation = proxyFactory.implementation(proxyAddr);
                uint256 version = proxyFactory.getCurrentVersion(proxyAddr);
                
                console.log("Proxy[", i, "]:", proxyAddr);
                console.log("  Implementation contract:", implementation);
                console.log("  Version:", version);
                
                // Display version history
                RWAUpgradeableProxy.VersionInfo[] memory history = proxyFactory.getVersionHistory(proxyAddr);
                console.log("  Version history:");
                for (uint256 j = 0; j < history.length; j++) {
                    console.log("    v");
                    console.log(history[j].version);
                    console.log(":");
                    console.log(history[j].implementation);
                    console.log(" (");
                    console.log(history[j].timestamp);
                    console.log(" by ");
                    console.log(history[j].upgradedBy);
                    console.log(")");
                }
            }
        }
        
        // TODO: Future configuration items
        // 1. Configure timelock controller to manage proxy upgrades
        // 2. Set governance voting mechanism for proxy upgrades
        // 3. Configure implementation contract verification process
        // 4. Set security check mechanism for proxy upgrades
        // 5. Configure permission management for proxy contracts
        // 6. Implement rollback mechanism for contract upgrades
        // 7. Configure event monitoring for proxy contracts
        // 8. Set emergency stop function for proxy contracts
        // 9. Configure gas optimization for proxy contracts
        // 10. Implement multi-signature management of proxy factory
        
        vm.stopBroadcast();
        
        console.log("\n=== Verification Commands ===");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200 ", address(proxyFactory), "src/RWAUpgradeableProxy.sol:RWAUpgradeableProxy");
        
        console.log("\n=== Environment Variables Configuration ===");
        console.log("export PROXY_FACTORY_ADDRESS=", address(proxyFactory));
        console.log("export RWA20_IMPLEMENTATION_ADDRESS=0x...");
        console.log("export GOVERNOR_IMPLEMENTATION_ADDRESS=0x...");
        console.log("export MULTISIG_IMPLEMENTATION_ADDRESS=0x...");
        console.log("export GOVERNANCE_TOKEN_ADDRESS=0x...");
        
        console.log("\n=== Proxy Mode Description ===");
        console.log("1. Transparent proxy mode, avoiding function selector conflicts");
        console.log("2. Based on ERC1967 standard, highly compatible");
        console.log("3. Complete version history recording");
        console.log("4. Ownership control of upgrade permissions");
        console.log("5. Supports proxying of any contract");
        
        console.log("\n=== Security Recommendations ===");
        console.log("1. Implementation contracts must include initialization functions");
        console.log("2. Initialization functions should only be callable once");
        console.log("3. Thoroughly test new implementations before upgrading");
        console.log("4. Consider using timelock to control upgrades");
        console.log("5. Important contracts should use multi-signature upgrade management");
        console.log("6. Regularly backup implementation contract code");
        
        console.log("\n=== Upgrade Process Example ===");
        console.log("1. Deploy new implementation contract");
        console.log("2. Test functionality of new implementation");
        console.log("3. Call proxyFactory.upgrade(proxy, newImplementation)");
        console.log("4. Verify upgrade results");
        console.log("5. If issues arise, can rollback to old version");
    }
}