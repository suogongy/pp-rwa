// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RWA20.sol";

contract DeployRWA20 is Script {
    function run() external {
        // Get configuration from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        string memory tokenName = "Real World Asset Token";
        string memory tokenSymbol = "RWA";
        
        // Try to read custom token name from environment
        try vm.envString("TOKEN_NAME") returns (string memory customName) {
            tokenName = customName;
        } catch {
            // Use default name
        }
        
        // Try to read custom token symbol from environment
        try vm.envString("TOKEN_SYMBOL") returns (string memory customSymbol) {
            tokenSymbol = customSymbol;
        } catch {
            // Use default symbol
        }
        
        // Start broadcasting
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contract
        RWA20 rwa20 = new RWA20(
            tokenName,
            tokenSymbol,
            msg.sender
        );
        
        // Stop broadcasting
        vm.stopBroadcast();
        
        // Output deployment information
        console.log("=== RWA20 Contract Deployed Successfully ===");
        console.log("Contract Address:", address(rwa20));
        console.log("Token Name:", tokenName);
        console.log("Token Symbol:", tokenSymbol);
        console.log("Deployer Address:", msg.sender);
        console.log("Network ID:", block.chainid);
        console.log("==========================================");
        
        // Output contract information
        console.log("Total Supply:", rwa20.totalSupply());
        console.log("Decimals:", rwa20.decimals());
        console.log("Owner Address:", rwa20.owner());
    }
}

contract DeployToSepolia is Script {
    function run() external {
        // Get RPC URL from environment variables
        string memory sepoliaRpcUrl = vm.envString("SEPOLIA_RPC_URL");
        
        console.log("Deploying to Sepolia Testnet...");
        console.log("RPC URL:", sepoliaRpcUrl);
        
        // Set network to Sepolia testnet
        vm.createSelectFork(sepoliaRpcUrl);
        
        // Call deployment function
        DeployRWA20 deployer = new DeployRWA20();
        deployer.run();
    }
}

contract DeployToLocal is Script {
    function run() external {
        // Get local RPC URL from environment variables, default to localhost:8545
        string memory localRpcUrl = "http://localhost:8545";
        
        // Try to read custom RPC URL from environment
        try vm.envString("LOCAL_RPC_URL") returns (string memory customRpcUrl) {
            localRpcUrl = customRpcUrl;
        } catch {
            // Use default RPC URL
        }
        
        console.log("Deploying to Local Network...");
        console.log("RPC URL:", localRpcUrl);
        
        // Set local network
        vm.createSelectFork(localRpcUrl);
        
        // Call deployment function
        DeployRWA20 deployer = new DeployRWA20();
        deployer.run();
    }
}

contract DeployToMainnet is Script {
    function run() external {
        // Get mainnet RPC URL from environment variables
        string memory mainnetRpcUrl = vm.envString("MAINNET_RPC_URL");
        
        console.log("Deploying to Ethereum Mainnet...");
        console.log("RPC URL:", mainnetRpcUrl);
        console.log("WARNING: This is mainnet deployment, please confirm!");
        
        // Set mainnet
        vm.createSelectFork(mainnetRpcUrl);
        
        // Call deployment function
        DeployRWA20 deployer = new DeployRWA20();
        deployer.run();
    }
}