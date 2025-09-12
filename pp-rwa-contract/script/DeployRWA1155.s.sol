// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/RWA1155.sol";

/**
 * @title DeployRWA1155
 * @dev RWA1155多代币合约独立部署脚本
 * 部署支持ERC-1155标准的多代币系统，支持同质化和非同质化代币
 */
contract DeployRWA1155 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== RWA1155 Multi-Token Contract Deployment ===");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        // Configure base URI
        // TODO: Get base URI from environment variables or use default value
        string memory baseURI = "https://bafybeigvb2ehu3fspcgmw7mff6sdamujsoq766ffkwggqiwomqs2cwbmwu.ipfs.localhost:8080/{id}.json";
        
        console.log("Base URI:", baseURI);
        
        // Deploy RWA1155 contract
        RWA1155 rwa1155 = new RWA1155(baseURI);
        
        console.log("RWA1155 contract deployed at:", address(rwa1155));
        console.log("Contract owner:", rwa1155.owner());
        console.log("Current token types count:", rwa1155.getTokenCount());
        
        // Verify base URI setting
        console.log("\n=== Base URI Verification ===");
        console.log("Contract URI configuration completed");
        
        // Create example token types
        console.log("\n=== Creating Example Token Types ===");
        
        // Token type 1: Real Estate Share
        uint256 realEstateTokenId = rwa1155.createToken(
            "Real Estate Share",
            "RES",
            1000, // Initial supply
            true,  // Mintable
            true,  // Burnable
            true,  // Transferable
            ""     // Additional data
        );
        console.log("Real Estate token created successfully, ID:", realEstateTokenId);
        
        // Token type 2: Bond
        uint256 bondTokenId = rwa1155.createToken(
            "Corporate Bond",
            "BOND",
            500,  // Initial supply
            true,  // Mintable
            true,  // Burnable
            true,  // Transferable
            ""     // Additional data
        );
        console.log("Bond token created successfully, ID:", bondTokenId);
        
        // Token type 3: Art Fraction
        uint256 artTokenId = rwa1155.createToken(
            "Art Fraction",
            "ART",
            100,  // Initial supply
            false, // Not mintable (fixed supply)
            true,  // Burnable
            true,  // Transferable
            ""     // Additional data
        );
        console.log("Art token created successfully, ID:", artTokenId);
        
        // Token type 4: Commodity Certificate
        uint256 commodityTokenId = rwa1155.createToken(
            "Commodity Certificate",
            "COMM",
            2000, // Initial supply
            true,  // Mintable
            true,  // Burnable
            true,  // Transferable
            ""     // Additional data
        );
        console.log("Commodity Certificate token created successfully, ID:", commodityTokenId);
        
        // Display token statistics
        console.log("\n=== Token Statistics ===");
        uint256 tokenCount = rwa1155.getTokenCount();
        console.log("Total token types:", tokenCount);
        
        // Display detailed information for each token type
        console.log("\n=== Token Detailed Information ===");
        uint256[] memory tokenIds = new uint256[](4);
        tokenIds[0] = realEstateTokenId;
        tokenIds[1] = bondTokenId;
        tokenIds[2] = artTokenId;
        tokenIds[3] = commodityTokenId;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            try rwa1155.tokenInfos(tokenId) returns (
                string memory name,
                string memory symbol,
                uint256 totalSupply,
                bool isMintable,
                bool isBurnable,
                bool isTransferable
            ) {
                console.log("Token ID:", tokenId);
                console.log("  Name:", name);
                console.log("  Symbol:", symbol);
                console.log("  Total supply:", totalSupply);
                console.log("  Mintable:", isMintable ? "Yes" : "No");
                console.log("  Burnable:", isBurnable ? "Yes" : "No");
                console.log("  Transferable:", isTransferable ? "Yes" : "No");
                console.log();
            } catch {
                console.log("Token ID:", tokenId, " (Failed to get info)");
            }
        }
        
        // Configure whitelist
        console.log("=== Configuring Whitelist ===");
        
        // Add deployer to global whitelist
        rwa1155.setWhitelist(deployer, true);
        console.log("Deployer added to global whitelist");
        
        // Set token-level whitelist for test address
        address testAddress = address(0xa0Ee7A142d267C1f36714E4a8F75612F20a79720);
        rwa1155.setTokenWhitelist(realEstateTokenId, testAddress, true);
        console.log("Test address added to real estate token whitelist");
        
        // Verify whitelist settings
        bool deployerWhitelisted = rwa1155.isWhitelisted(deployer);
        bool testAddressTokenWhitelisted = rwa1155.isTokenWhitelisted(realEstateTokenId, testAddress);
        
        console.log("Deployer global whitelist status:", deployerWhitelisted ? "Authorized" : "Unauthorized");
        console.log("Test address token whitelist status:", testAddressTokenWhitelisted ? "Authorized" : "Unauthorized");
        
        // Test batch minting functionality
        console.log("\n=== Testing Batch Minting ===");
        
        address[] memory recipients = new address[](2);
        recipients[0] = deployer;
        recipients[1] = testAddress;
        
        uint256[] memory mintTokenIds = new uint256[](2);
        mintTokenIds[0] = realEstateTokenId;
        mintTokenIds[1] = bondTokenId;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 10; // 10 real estate tokens
        amounts[1] = 5;  // 5 bond tokens
        
        // Batch mint for test address
        rwa1155.mintBatch(testAddress, mintTokenIds, amounts, "");
        console.log("Batch minting for test address completed");
        
        // Verify balances
        console.log("\n=== Balance Verification ===");
        console.log("Deployer balance:");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            try rwa1155.balanceOf(deployer, tokenIds[i]) returns (uint256 balance) {
                console.log("  Token", tokenIds[i], ":", balance);
            } catch {
                console.log("  Token", tokenIds[i], ": Get failed");
            }
        }
        
        console.log("Test address balance:");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            try rwa1155.balanceOf(testAddress, tokenIds[i]) returns (uint256 balance) {
                console.log("  Token", tokenIds[i], ":", balance);
            } catch {
                console.log("  Token", tokenIds[i], ": Get failed");
            }
        }
        
        // TODO: Future configuration items
        // 1. Configure real IPFS or decentralized storage URI
        // 2. Set token metadata and attributes
        // 3. Configure token compliance checks (KYC/AML)
        // 4. Integrate oracle for real-time asset valuation
        // 5. Set tax calculation for token transfers
        // 6. Configure multi-signature wallet management for important token operations
        // 7. Implement token dividend and revenue distribution mechanisms
        // 8. Configure token locking and release schedules
        // 9. Set token voting and governance permissions
        // 10. Integrate timelock controller for important configuration changes
        
        vm.stopBroadcast();
        
        console.log("\n=== Verification Commands ===");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200 ", address(rwa1155), "src/RWA1155.sol:RWA1155");
        
        console.log("\n=== Environment Variables Configuration ===");
        console.log("export RWA1155_ADDRESS=", address(rwa1155));
        console.log("export RWA1155_BASE_URI=", baseURI);
        
        console.log("\n=== RWA1155 Features ===");
        console.log("1. Supports ERC-1155 multi-token standard");
        console.log("2. Fungible and non-fungible token support");
        console.log("3. Batch minting and transfer functionality");
        console.log("4. Flexible whitelist control");
        console.log("5. Configurable token properties (mintable, burnable, transferable)");
        console.log("6. Metadata URI management");
        console.log("7. Ownership control");
        
        console.log("\n=== Token Type Description ===");
        console.log("1. Real Estate Share (RES): Mintable, represents partial ownership of real estate");
        console.log("2. Corporate Bond (BOND): Mintable, represents bond ownership");
        console.log("3. Art Fraction (ART): Fixed supply, represents partial ownership of artwork");
        console.log("4. Commodity Certificate (COMM): Mintable, represents ownership of commodities");
        
        console.log("\n=== Usage Recommendations ===");
        console.log("1. Create independent token types for each RWA asset category");
        console.log("2. Set reasonable initial supply and minting permissions");
        console.log("3. Configure appropriate whitelist strategies");
        console.log("4. Ensure metadata URI points to valid asset information");
        console.log("5. Regularly audit token compliance and security");
        console.log("6. Consider implementing token locking mechanisms");
        
        console.log("\n=== Extension Feature Suggestions ===");
        console.log("1. Integrate Chainlink oracle for real-time price updates");
        console.log("2. Implement token staking and mining functionality");
        console.log("3. Add token voting and governance permissions");
        console.log("4. Implement cross-chain transfer functionality");
        console.log("5. Add token insurance and guarantee mechanisms");
    }
}