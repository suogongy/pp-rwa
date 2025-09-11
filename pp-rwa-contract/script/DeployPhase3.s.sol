// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/RWA20.sol";
import "../src/RWA1155.sol";
import "../src/RWAGovernor.sol";
import "../src/RWAMultisigWallet.sol";
import "../src/RWAOracle.sol";
import "../src/RWAUpgradeableProxy.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("RWA Governance Token", "RWA") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

contract DeployPhase3 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        // 1. 部署治理代币
        // TestToken governanceToken = new TestToken();
        RWA20 governanceToken = new RWA20("RWA Governance Token", "GOV", msg.sender);
        console.log("Governance Token deployed at:", address(governanceToken));
        
        // 2. 部署治理合约
        RWAGovernor governor = new RWAGovernor(
            governanceToken,
            1, // votingDelay
            50400, // votingPeriod (约1周)
            1000 * 10**18, // proposalThreshold
            4 // quorumNumerator (4%)
        );
        console.log("Governor deployed at:", address(governor));
        
        // 5. 部署多签钱包
        address[] memory initialSigners = new address[](3);
        initialSigners[0] = deployer;
        initialSigners[1] = address(0xa0Ee7A142d267C1f36714E4a8F75612F20a79720);
        initialSigners[2] = address(0x0987654321098765432109876543210987654321);
        
        RWAMultisigWallet multisigWallet = new RWAMultisigWallet(
            initialSigners,
            2 // signatureThreshold
        );
        console.log("Multisig Wallet deployed at:", address(multisigWallet));
        
        // 6. 部署预言机合约
        RWAOracle oracle = new RWAOracle();
        console.log("Oracle deployed at:", address(oracle));
        
        // 7. 部署可升级代理工厂
        RWAUpgradeableProxy proxyFactory = new RWAUpgradeableProxy();
        console.log("Proxy Factory deployed at:", address(proxyFactory));
        
        // 8. 部署RWA1155代币合约
        RWA1155 rwa1155 = new RWA1155(
            "http://bafybeigvb2ehu3fspcgmw7mff6sdamujsoq766ffkwggqiwomqs2cwbmwu.ipfs.localhost:8080/{id}.json"
        );
        console.log("RWA1155 deployed at:", address(rwa1155));
        
        // 9. 为多签钱包转账一些ETH
        payable(address(multisigWallet)).transfer(1 ether);
        console.log("Transferred 1 ETH to Multisig Wallet");
        
        // 10. 为预言机转账一些ETH
        payable(address(oracle)).transfer(0.5 ether);
        console.log("Transferred 0.5 ETH to Oracle");
        
        // 11. 转移一些治理代币给多签钱包
        governanceToken.transfer(address(multisigWallet), 10000 * 10**18);
        console.log("Transferred 10000 RWA tokens to Multisig Wallet");
        
        // 12. 输出所有合约地址
        console.log("\n=== Phase 3 Deployment Summary ===");
        console.log("Governance Token:", address(governanceToken));
        console.log("Governor:", address(governor));
        console.log("Multisig Wallet:", address(multisigWallet));
        console.log("Oracle:", address(oracle));
        console.log("Proxy Factory:", address(proxyFactory));
        console.log("RWA1155:", address(rwa1155));
        
        // 13. 验证合约配置
        console.log("\n=== Contract Configuration ===");
        console.log("Governor Token Address:", address(governanceToken));
        console.log("Multisig Signers:", initialSigners.length);
        console.log("Multisig Threshold:", multisigWallet.signatureThreshold());
        console.log("RWA1155 Owner:", rwa1155.owner());
        
        vm.stopBroadcast();
        
        // 14. 输出验证信息
        console.log("\n=== Verification Commands ===");
        console.log("Governor Token:");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200", address(governanceToken), "src/DeployPhase3.sol:TestToken");
        
        console.log("\nGovernor:");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200", address(governor), "src/RWAGovernor.sol:RWAGovernor");
        
        console.log("\nMultisig Wallet:");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200", address(multisigWallet), "src/RWAMultisigWallet.sol:RWAMultisigWallet");
        
        console.log("\nOracle:");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200", address(oracle), "src/RWAOracle.sol:RWAOracle");
        
        console.log("\nProxy Factory:");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200", address(proxyFactory), "src/RWAUpgradeableProxy.sol:RWAUpgradeableProxy");
        
        console.log("\nRWA1155:");
        console.log("forge verify-contract --chain-id 11155111 --compiler-version v0.8.19 --num-of-optimizations 200", address(rwa1155), "src/RWA1155.sol:RWA1155");
    }
}