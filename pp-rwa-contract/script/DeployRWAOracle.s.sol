// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/RWAOracle.sol";

/**
 * @title DeployRWAOracle
 * @dev RWA预言机独立部署脚本
 * 部署价格数据存储、资产估值和随机数生成服务
 */
contract DeployRWAOracle is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== RWA Oracle Deployment ===");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        // Deploy oracle contract
        RWAOracle oracle = new RWAOracle();
        
        console.log("Oracle deployed at:", address(oracle));
        console.log("Oracle owner:", oracle.owner());
        
        // Initialize common price feeds
        console.log("\n=== Initializing Price Feeds ===");
        
        // ETH/USD price feed (simulated)
        string memory ethSymbol = "ETH/USD";
        address ethFeedAddress = address(0); // Simplified version, should use Chainlink address in production
        uint8 ethDecimals = 8;
        
        oracle.addPriceFeed(ethSymbol, ethFeedAddress, ethDecimals);
        oracle.updatePrice(ethSymbol, 300000000000); // $3000.00 (8 decimals)
        console.log("Added price feed:", ethSymbol, "price: $3000.00");
        
        // BTC/USD price feed (simulated)
        string memory btcSymbol = "BTC/USD";
        address btcFeedAddress = address(0);
        uint8 btcDecimals = 8;
        
        oracle.addPriceFeed(btcSymbol, btcFeedAddress, btcDecimals);
        oracle.updatePrice(btcSymbol, 450000000000); // $45000.00 (8 decimals)
        console.log("Added price feed:", btcSymbol, "price: $45000.00");
        
        // USDT/USD price feed (simulated)
        string memory usdtSymbol = "USDT/USD";
        address usdtFeedAddress = address(0);
        uint8 usdtDecimals = 8;
        
        oracle.addPriceFeed(usdtSymbol, usdtFeedAddress, usdtDecimals);
        oracle.updatePrice(usdtSymbol, 100000000); // $1.00 (8 decimals)
        console.log("Added price feed:", usdtSymbol, "price: $1.00");
        
        // Verify price feed configuration
        console.log("\n=== Price Feed Verification ===");
        uint256 priceFeedCount = oracle.getPriceFeedCount();
        console.log("Price feeds count:", priceFeedCount);
        
        // Get and display prices
        int256 ethPrice = oracle.getPrice(ethSymbol);
        int256 btcPrice = oracle.getPrice(btcSymbol);
        int256 usdtPrice = oracle.getPrice(usdtSymbol);
        
        console.log("ETH/USD price:", ethPrice / 10**8);
        console.log("USD");
        console.log("BTC/USD price:", btcPrice / 10**8);
        console.log("USD");
        console.log("USDT/USD price:", usdtPrice / 10**8);
        console.log("USD");
        
        // Test asset valuation functionality
        console.log("\n=== Testing Asset Valuation ===");
        
        // Simulate RWA asset valuation
        uint256 assetId1 = 1;
        uint256 assetId2 = 2;
        
        oracle.requestAssetValuation(assetId1, ethSymbol);
        oracle.requestAssetValuation(assetId2, btcSymbol);
        
        uint256 valuation1 = oracle.getAssetValuation(assetId1);
        uint256 valuation2 = oracle.getAssetValuation(assetId2);
        
        console.log("Asset[", assetId1, "] valuation: $", valuation1 / 10**8);
        console.log("Asset[", assetId2, "] valuation: $", valuation2 / 10**8);
        
        uint256 assetValuationCount = oracle.getAssetValuationCount();
        console.log("Valuated assets count:", assetValuationCount);
        
        // Test random number generation
        console.log("\n=== Testing Random Number Generation ===");
        
        uint256 randomSeed1 = 12345;
        uint256 randomSeed2 = 67890;
        
        uint256 requestId1 = oracle.requestRandomNumber(randomSeed1);
        uint256 requestId2 = oracle.requestRandomNumber(randomSeed2);
        
        console.log("Random number request 1 ID:", requestId1);
        console.log("Random number request 2 ID:", requestId2);
        
        uint256[] memory randomNumbers1 = oracle.getRandomNumber(requestId1);
        uint256[] memory randomNumbers2 = oracle.getRandomNumber(requestId2);
        
        console.log("Random number result 1:", randomNumbers1[0]);
        console.log("Random number result 2:", randomNumbers2[0]);
        
        // Transfer some ETH to oracle for operational costs
        uint256 initialFunding = 0.5 ether;
        if (deployer.balance >= initialFunding) {
            payable(address(oracle)).transfer(initialFunding);
            console.log("Transferred to oracle:", initialFunding / 10**18, "ETH");
        } else {
            console.log("Warning: Deployer balance insufficient, cannot provide initial funding to oracle");
        }
        
        // TODO: Future configuration items
        // 1. Integrate real Chainlink price feed contracts
        // 2. Configure more asset category price feeds (gold, silver, real estate indices, etc.)
        // 3. Set price update intervals and automated update mechanisms
        // 4. Configure asset valuation verification mechanisms
        // 5. Integrate VRF (Verifiable Random Function) to replace pseudo-random number generation
        // 6. Set oracle permission control (who can request valuation and random numbers)
        // 7. Configure price data storage and retrieval optimization
        // 8. Set oracle failure recovery mechanisms
        // 9. Configure multi-signature management of oracle
        // 10. Integrate timelock controller for important configuration changes
        
        vm.stopBroadcast();
        
        console.log("\n=== Verification Commands ===");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200 ", address(oracle), "src/RWAOracle.sol:RWAOracle");
        
        console.log("\n=== Environment Variables Configuration ===");
        console.log("export ORACLE_ADDRESS=", address(oracle));
        
        console.log("\n=== Oracle Features ===");
        console.log("1. Price data storage and management");
        console.log("2. Asset valuation services");
        console.log("3. Pseudo-random number generation");
        console.log("4. Ownership control");
        console.log("5. Event logging");
        
        console.log("\n=== Important Reminders ===");
        console.log("1. Current version is simplified, production environment should integrate Chainlink");
        console.log("2. Random number generation is pseudo-random, use VRF for high-security scenarios");
        console.log("3. Price data is simulated, needs connection to real data sources");
        console.log("4. Consider setting up automated price update mechanisms");
        console.log("5. Consider implementing multi-oracle data aggregation for improved reliability");
        
        console.log("\n=== Chainlink Integration Suggestions ===");
        console.log("1. Register Chainlink node operators");
        console.log("2. Configure Chainlink price feed contract addresses");
        console.log("3. Implement Chainlink VRF for verifiable random numbers");
        console.log("4. Set up Chainlink Automation for periodic price updates");
        console.log("5. Configure Chainlink Keepers for automated tasks");
    }
}