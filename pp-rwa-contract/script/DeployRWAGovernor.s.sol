// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/RWAGovernor.sol";
import "../src/RWA20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title DeployRWAGovernor
 * @dev RWA治理合约独立部署脚本
 * 部署基于ERC20代币的DAO治理系统
 */
contract DeployRWAGovernor is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== RWA Governor Deployment ===");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        // TODO: Need to deploy RWA20 governance token first, then configure token address
        // Use environment variable to get governance token address, deploy new one if not exists
        address governanceTokenAddress = vm.envOr("GOVERNANCE_TOKEN_ADDRESS", address(0));
        
        IVotes token;
        
        if (governanceTokenAddress == address(0)) {
            console.log("Governance token address not found, deploying new RWA20 governance token...");
            
            // 部署RWA20治理代币
            string memory tokenName = "RWA Governance Token";
            string memory tokenSymbol = "GOV";
            address initialOwner = deployer;
            
            RWA20 newToken = new RWA20(tokenName, tokenSymbol, initialOwner);
            token = IVotes(address(newToken));
            
            console.log("Governance token deployed at:", address(newToken));
            console.log("Token name:", tokenName);
            console.log("Token symbol:", tokenSymbol);
            console.log("Initial owner:", initialOwner);
            
            // Mint some tokens for deployer for governance testing
            newToken.mint(deployer, 1000000 * 10**18);
            console.log("Minted 1,000,000 governance tokens for deployer");
        } else {
            console.log("Using existing governance token:", governanceTokenAddress);
            token = IVotes(governanceTokenAddress);
        }
        
        // 部署治理合约 (需要TimelockController)
        uint256 votingDelay = 1; // 1 block
        uint256 votingPeriod = 50400; // 约1周 (50400 blocks)
        uint256 proposalThreshold = 1000 * 10**18; // 1000 tokens
        uint256 quorumNumerator = 4; // 4%
        
        uint256 minDelay = 1 days;
        address[] memory proposers = new address[](1);
        proposers[0] = deployer;
        address[] memory executors = new address[](1);
        executors[0] = deployer;
        
        TimelockController timelock = new TimelockController(minDelay, proposers, executors, deployer);
        console.log("TimelockController deployed at:", address(timelock));
        
        RWAGovernor governor = new RWAGovernor(token, timelock);
        
        console.log("Governor deployed at:", address(governor));
        console.log("Governance token address:", address(token));
        console.log("Voting delay:", votingDelay, "blocks");
        console.log("Voting period:", votingPeriod, "blocks");
        console.log("Proposal threshold:", proposalThreshold / 10**18, "tokens");
        console.log("Quorum numerator:", quorumNumerator, "%");
        
        // Verify deployment
        console.log("\n=== Deployment Verification ===");
        console.log("Governor name:", governor.name());
        console.log("Voting delay:", governor.votingDelay());
        console.log("Voting period:", governor.votingPeriod());
        console.log("Proposal threshold:", governor.proposalThreshold() / 10**18, "tokens");
        console.log("Quorum numerator:", governor.quorumNumerator());
        console.log("Governance token:", address(governor.token()));
        
        // TODO: Future configuration items
        // 1. Configure timelock controller for enhanced security
        // 2. Set governance proposal execution permissions
        // 3. Configure governance permissions for multisig wallet
        // 4. Set time delay for proposal execution
        // 5. Set initial governance parameters (adjustable through future proposals)
        // 6. Deploy governance-related frontend interface configuration
        // 7. Configure voting weight calculation for governance token
        // 8. Set proposal review mechanism (if needed)
        
        vm.stopBroadcast();
        
        console.log("\n=== Verification Commands ===");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200 ", address(governor), "src/RWAGovernor.sol:RWAGovernor");
        
        console.log("\n=== Environment Variables Configuration ===");
        console.log("export GOVERNOR_ADDRESS=", address(governor));
        console.log("export GOVERNANCE_TOKEN_ADDRESS=", address(token));
        
        console.log("\n=== Governance Parameters Description ===");
        console.log("Voting delay: 1 block (~15 seconds)");
        console.log("Voting period: 50400 blocks (~1 week)");
        console.log("Proposal threshold: 1000 governance tokens");
        console.log("Quorum: 4% of total supply");
        console.log("Vote types: For(1), Against(0), Abstain(2)");
    }
}