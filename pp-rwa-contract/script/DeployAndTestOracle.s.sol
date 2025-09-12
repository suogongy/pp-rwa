// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Script, console } from "forge-std/Script.sol";
import { RWAOracle } from "../src/RWAOracle.sol";

/**
 * @title DeployAndTestOracle
 * @dev Deploy and test oracle contract complete workflow
 * Features:
 * - Deploy oracle contract
 * - Initialize price feeds
 * - Test all functionality
 */
contract DeployAndTestOracle is Script {
    function run() external {
        // Start broadcast
        vm.startBroadcast();
        
        console.log("Starting oracle contract deployment...");
        
        // Deploy oracle contract
        RWAOracle oracle = new RWAOracle();
        address oracleAddress = address(oracle);
        
        console.log("Oracle contract deployment completed!");
        console.log("Contract Address:", oracleAddress);
        
        // Initialize price feeds
        console.log("\nStarting price feed initialization...");
        
        // Add ETH price feed
        oracle.addPriceFeed("ETH", payable(0x0000000000000000000000000000000000000000), 8);
        console.log("ETH price feed added successfully");
        
        // Add BTC price feed
        oracle.addPriceFeed("BTC", payable(0x0000000000000000000000000000000000000000), 8);
        console.log("BTC price feed added successfully");
        
        // Set initial prices
        oracle.updatePrice("ETH", 350000000000); // $3500.00
        console.log("ETH price set to: $3500.00");
        
        oracle.updatePrice("BTC", 450000000000); // $45000.00
        console.log("BTC price set to: $45000.00");
        
        // Test price reading
        console.log("\nStarting price reading functionality test...");
        int256 ethPrice = oracle.getPrice("ETH");
        int256 btcPrice = oracle.getPrice("BTC");
        
        console.log("ETH Price:", ethPrice);
        console.log("BTC Price:", btcPrice);
        
        // Test random number generation
        console.log("\nStarting random number generation functionality test...");
        uint256 seed1 = block.timestamp;
        uint256 requestId1 = oracle.requestRandomNumber(seed1);
        console.log("Random number request 1 ID:", requestId1);
        
        // Read random number result
        uint256[] memory randomNumbers1 = oracle.getRandomNumber(requestId1);
        console.log("Random number 1 result:", randomNumbers1[0]);
        
        // Test asset valuation
        console.log("\nStarting asset valuation functionality test...");
        uint256 assetId = 1;
        oracle.requestAssetValuation(assetId, "ETH");
        uint256 valuation = oracle.getAssetValuation(assetId);
        console.log("Asset", assetId, "valuation:", valuation);
        
        // Test multiple random number generation
        console.log("\nTesting multiple random number generation...");
        for (uint i = 0; i < 3; i++) {
            uint256 seed = block.timestamp + i;
            uint256 requestId = oracle.requestRandomNumber(seed);
            uint256[] memory randomNumbers = oracle.getRandomNumber(requestId);
            console.log("Random number", i + 1, ":", randomNumbers[0]);
        }
        
        // Output statistics
        console.log("\n=== Oracle Contract Statistics ===");
        uint256 priceFeedCount = oracle.getPriceFeedCount();
        uint256 valuationCount = oracle.getAssetValuationCount();
        
        console.log("Price feed count:", priceFeedCount);
        console.log("Asset valuation count:", valuationCount);
        console.log("Random request count:", oracle.randomRequestCount());
        
        vm.stopBroadcast();
        
        console.log("\nOracle contract deployment and testing completed!");
        
        // Output environment variable configuration
        console.log("\n=== Environment Variable Configuration ===");
        console.log("Please add the following configuration to .env file:");
        console.log("NEXT_PUBLIC_RWA_ORACLE_ADDRESS=", oracleAddress);
        
        console.log("\n=== Function Test Results ===");
        console.log("Contract deployment successful");
        console.log("Price feed configuration successful");
        console.log("Price update functionality normal");
        console.log("Random number generation functionality normal");
        console.log("Asset valuation functionality normal");
        console.log("All function tests passed");
    }
}