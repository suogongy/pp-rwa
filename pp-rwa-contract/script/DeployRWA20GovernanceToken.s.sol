// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/RWA20.sol";

/**
 * @title DeployRWA20GovernanceToken
 * @dev RWA20治理代币独立部署脚本
 * 部署用于DAO治理的ERC20代币
 */
contract DeployRWA20GovernanceToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== RWA20 Governance Token Deployment ===");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        // Deploy RWA20 governance token
        string memory tokenName = "RWA Governance Token";
        string memory tokenSymbol = "GOV";
        address initialOwner = deployer;
        
        RWA20 governanceToken = new RWA20(tokenName, tokenSymbol, initialOwner);
        
        console.log("Governance token deployed at:", address(governanceToken));
        console.log("Token name:", tokenName);
        console.log("Token symbol:", tokenSymbol);
        console.log("Initial owner:", initialOwner);
        
        // Verify deployment
        console.log("\n=== Deployment Verification ===");
        console.log("Token name:", governanceToken.name());
        console.log("Token symbol:", governanceToken.symbol());
        console.log("Decimals:", governanceToken.decimals());
        console.log("Owner:", governanceToken.owner());
        
        // TODO: Future configuration items
        // 1. Set token permissions for governance contract
        // 2. Allocate initial tokens to multisig wallet
        // 3. Configure token minting permissions (if needed)
        // 4. Set up token transfer permissions
        
        vm.stopBroadcast();
        
        console.log("\n=== Verification Commands ===");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200 ", address(governanceToken), "src/RWA20.sol:RWA20");
        
        console.log("\n=== Environment Variables Configuration ===");
        console.log("export GOVERNANCE_TOKEN_ADDRESS=", address(governanceToken));
    }
}