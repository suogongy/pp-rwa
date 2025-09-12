// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/RWAMultisigWallet.sol";

/**
 * @title DeployRWAMultisigWallet
 * @dev RWA多签钱包独立部署脚本
 * 部署支持多种资产类型的多签名钱包系统
 */
contract DeployRWAMultisigWallet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== RWA Multisig Wallet Deployment ===");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        // Configure initial signers
        address[] memory initialSigners = new address[](3);
        initialSigners[0] = deployer;
        
        // TODO: Get other signer addresses from environment variables or use test addresses
        // In production, these addresses should be obtained from config files or environment variables
        address signer1 = vm.envOr("MULTISIG_SIGNER_1", address(0xa0Ee7A142d267C1f36714E4a8F75612F20a79720));
        address signer2 = vm.envOr("MULTISIG_SIGNER_2", address(0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f));
        
        if (signer1 != address(0)) {
            initialSigners[1] = signer1;
            console.log("Using configured signer 1:", signer1);
        } else {
            console.log("Warning: Signer 1 not configured, using test address");
            initialSigners[1] = address(0xa0Ee7A142d267C1f36714E4a8F75612F20a79720);
        }
        
        if (signer2 != address(0)) {
            initialSigners[2] = signer2;
            console.log("Using configured signer 2:", signer2);
        } else {
            console.log("Warning: Signer 2 not configured, using test address");
            initialSigners[2] = address(0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f);
        }
        
        // Configure signature threshold (how many signers need to confirm to execute transaction)
        uint256 signatureThreshold = 2; // 2-of-3 multisig
        
        // Validate configuration
        require(initialSigners.length >= signatureThreshold, "Number of signers must be greater than or equal to signature threshold");
        require(signatureThreshold > 0, "Signature threshold must be greater than 0");
        require(initialSigners.length <= 20, "Number of signers cannot exceed 20");
        
        console.log("Initial signers count:", initialSigners.length);
        console.log("Signature threshold:", signatureThreshold);
        
        // Display all signers
        for (uint256 i = 0; i < initialSigners.length; i++) {
            console.log("Signer[", i, "]:", initialSigners[i]);
        }
        
        // Deploy multisig wallet
        RWAMultisigWallet multisigWallet = new RWAMultisigWallet(
            initialSigners,
            signatureThreshold
        );
        
        console.log("Multisig wallet deployed at:", address(multisigWallet));
        
        // Verify deployment
        console.log("\n=== Deployment Verification ===");
        console.log("Wallet owner:", multisigWallet.owner());
        console.log("Signers count:", multisigWallet.signerCount());
        console.log("Signature threshold:", multisigWallet.signatureThreshold());
        console.log("Emergency pause status:", multisigWallet.emergencyPaused() ? "Paused" : "Running");
        
        // Verify initial signers
        address[] memory activeSigners = multisigWallet.getActiveSigners();
        console.log("Active signers count:", activeSigners.length);
        for (uint256 i = 0; i < activeSigners.length; i++) {
            console.log("Active signer[", i, "]:", activeSigners[i]);
            bool isActive = multisigWallet.isActiveSigner(activeSigners[i]);
            console.log("  Status:", isActive ? "Active" : "Inactive");
        }
        
        // Transfer some ETH to multisig wallet for transaction fees
        uint256 initialFunding = 1 ether;
        if (deployer.balance >= initialFunding) {
            payable(address(multisigWallet)).transfer(initialFunding);
            console.log("Transferred to multisig wallet:", initialFunding / 10**18, "ETH");
        } else {
            console.log("Warning: Deployer balance insufficient, cannot provide initial funding to multisig wallet");
        }
        
        // TODO: Future configuration items
        // 1. Configure multisig wallet integration with governance contract
        // 2. Set multisig wallet as owner for certain contracts
        // 3. Configure asset transfer permissions and whitelists
        // 4. Set transaction amount limits
        // 5. Configure daily transaction limits
        // 6. Set governance permissions for multisig wallet (e.g., executing governance proposals)
        // 7. Configure oracle fee payment permissions
        // 8. Set emergency situation handling procedures
        // 9. Configure signer rotation mechanism
        // 10. Integrate timelock controller for enhanced security
        
        vm.stopBroadcast();
        
        console.log("\n=== Verification Commands ===");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200 ", address(multisigWallet), "src/RWAMultisigWallet.sol:RWAMultisigWallet");
        
        console.log("\n=== Environment Variables Configuration ===");
        console.log("export MULTISIG_WALLET_ADDRESS=", address(multisigWallet));
        
        console.log("\n=== Signers Configuration Example ===");
        console.log("export MULTISIG_SIGNER_1=0x...");
        console.log("export MULTISIG_SIGNER_2=0x...");
        console.log("export MULTISIG_SIGNER_3=0x...");
        
        console.log("\n=== Multisig Wallet Features ===");
        console.log("1. Supports ETH, ERC20, ERC721, ERC1155 asset transfers");
        console.log("2. Supports contract call interactions");
        console.log("3. Signature threshold mechanism: ", signatureThreshold);
        console.log("   of ", initialSigners.length, " multisig");
        console.log("4. Transaction validity period: 7 days");
        console.log("5. Emergency pause function");
        console.log("6. Dynamic signer management");
        console.log("7. Transaction history records");
        console.log("8. EIP712 signature verification");
        
        console.log("\n=== Security Reminders ===");
        console.log("1. Please keep signer private keys secure");
        console.log("2. Regularly check signer status");
        console.log("3. Set reasonable signature threshold to avoid single point of failure");
        console.log("4. Consider higher signature threshold for large transactions");
        console.log("5. Use pause function in emergency situations");
    }
}