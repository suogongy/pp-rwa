# PP-RWA 智能合约套件

基于 OpenZeppelin 标准库的高安全性、标准化的现实世界资产（RWA）代币化合约套件，包含 ERC20、ERC721 和质押合约。

## 🌟 项目特性

### 🔒 安全性
- **OpenZeppelin v5.4.0**: 使用行业标准的、经过审计的安全库
- **多重防护**: 集成 Ownable、Pausable、ReentrancyGuard 安全模块
- **访问控制**: 完善的权限管理和安全机制
- **重入保护**: 防范重入攻击的安全措施

### ⚡ 性能优化
- **Gas 优化**: 紧凑的存储布局和高效的算法
- **批量操作**: 支持批量转账和批量铸造
- **事件优化**: 改进的事务ID生成机制

### 🚀 核心功能
- **RWA20**: 标准 ERC20 代币，支持铸造、销毁、批量转账
- **RWA721**: ERC721 NFT 代币，支持批量铸造、版税管理
- **RWAStaking**: 灵活的代币质押系统，支持多期限和动态奖励
- **完整的测试套件**: 54个测试用例，全面的测试覆盖

## 🛠️ 开发环境

### 要求
- [Foundry](https://github.com/foundry-rs/foundry): Ethereum 开发框架
- Node.js (用于前端开发)

### 安装 Foundry
```bash
# 安装 foundryup
curl -L https://foundry.paradigm.xyz | bash

# 安装 forge, cast, anvil
foundryup
```

### 项目设置
```bash
# 克隆项目
git clone <repository-url>
cd pp-rwa-contract

# 安装依赖
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std

# 复制环境变量配置
cp .env.example .env
# 编辑 .env 文件填入你的配置
```

## 🔧 环境变量配置

在项目根目录创建 `.env` 文件：

```bash
# 本地开发网络
LOCAL_RPC_URL=http://127.0.0.1:8545

# 部署者私钥（测试用，不要在生产环境使用）
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Infura API Key
INFURA_API_KEY=your_infura_api_key_here

# Etherscan API Key（合约验证用）
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# 网络配置
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/${INFURA_API_KEY}
MAINNET_RPC_URL=https://mainnet.infura.io/v3/${INFURA_API_KEY}
```

## 📝 开发命令

### 构建和测试
```bash
# 构建合约
forge build

# 运行所有测试
forge test

# 运行特定测试
forge test --match-contract RWA20Test
forge test --match-contract RWA721Test
forge test --match-contract RWAStakingTest

# 详细测试输出
forge test -v

# 生成 Gas 报告
forge test --gas-report

# 运行单个测试
forge test --match-test testMint
```

### 代码格式化
```bash
# 格式化所有 Solidity 文件
forge fmt

# 检查格式是否正确
forge fmt --check
```

### 本地开发
```bash
# 启动本地测试网络
anvil --host 0.0.0.0 --port 8545

# 或使用预设账户
anvil --mnemonic "test test test test test test test test test test test junk"
```

## 🚀 部署指南

### 环境准备
1. 复制环境变量配置文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入您的配置：
   - `PRIVATE_KEY`: 部署者私钥
   - `LOCAL_RPC_URL`: 本地节点URL
   - `SEPOLIA_RPC_URL`: Sepolia测试网URL
   - `INFURA_API_KEY`: Infura API密钥
   - `ETHERSCAN_API_KEY`: Etherscan API密钥

### 单个合约部署
```bash
# 部署 RWA20 合约
forge script script/DeployRWA20.s.sol:DeployRWA20 --rpc-url $env:LOCAL_RPC_URL --private-key $env:PRIVATE_KEY --broadcast

# 部署 RWA721 合约
forge script script/DeployRWA721.s.sol:DeployRWA721 --rpc-url $env:LOCAL_RPC_URL --private-key $env:PRIVATE_KEY --broadcast

# 部署 RWAStaking 合约（需要先部署 RWA20）
# 方法1：让脚本自动部署 RWA20
forge script script/DeployRWAStaking.s.sol:DeployRWAStaking --rpc-url $env:LOCAL_RPC_URL --private-key $env:PRIVATE_KEY --broadcast

# 方法2：使用已部署的 RWA20 地址
export RWA20_ADDRESS=0xYourRWA20ContractAddress
forge script script/DeployRWAStaking.s.sol:DeployRWAStaking --rpc-url $env:LOCAL_RPC_URL --private-key $env:PRIVATE_KEY --broadcast
```

### 批量部署
```bash
# 部署所有合约（推荐）
forge script script/DeployAll.s.sol:DeployAll --rpc-url $env:LOCAL_RPC_URL --private-key $env:PRIVATE_KEY --broadcast
```

### 测试网部署
```bash
# 部署到 Sepolia 测试网
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $env:SEPOLIA_RPC_URL \
  --private-key $env:PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $env:ETHERSCAN_API_KEY
```

### 主网部署
```bash
# 部署到以太坊主网
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $env:MAINNET_RPC_URL \
  --private-key $env:PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $env:ETHERSCAN_API_KEY
```

### 部署后配置
部署完成后，请将合约地址记录到 `.env` 文件中：
```bash
# 示例：记录已部署的合约地址
RWA20_ADDRESS=0x1234567890123456789012345678901234567890
RWA721_ADDRESS=0x0987654321098765432109876543210987654321
RWA_STAKING_ADDRESS=0x5678901234567890123456789012345678901234
```

## 📊 合约信息

### RWA20 (ERC20 代币)
- **代币名称**: 可配置（默认：Real World Asset Token）
- **代币符号**: 可配置（默认：RWA）
- **精度**: 18 位小数
- **初始供应量**: 1,000,000 代币
- **核心功能**: 铸造、销毁、批量转账、白名单管理、暂停机制

### RWA721 (ERC721 NFT)
- **代币标准**: ERC721 兼容
- **元数据**: 支持 IPFS 集成
- **版税**: 内置版税分配机制
- **批量铸造**: 支持最多50个NFT批量铸造
- **核心功能**: 铸造、销毁、元数据管理、版税设置

### RWAStaking (质押合约)
- **质押代币**: RWA20 代币
- **多期限支持**: 灵活的质押周期配置
- **动态奖励**: 可调整的奖励率
- **复利选项**: 自动复利功能
- **核心功能**: 质押、解质押、奖励申领、紧急提取

### 核心函数概览
```solidity
// RWA20 主要功能
mint(address to, uint256 amount)                    // 铸造新代币
burn(uint256 amount)                                // 销毁代币
batchTransfer(address[] calldata recipients, uint256[] calldata amounts) // 批量转账

// RWA721 主要功能
mintNFT(address to, string memory tokenURI)        // 铸造单个NFT
mintBatch(address to, uint256 count, string memory baseURI) // 批量铸造
setRoyalty(uint256 tokenId, address recipient, uint256 percentage) // 设置版税

// RWAStaking 主要功能
stake(uint256 amount, uint256 lockPeriod)           // 质押代币
unstake(bytes32 stakeId, uint256 amount)            // 解质押
claimRewards(bytes32 stakeId)                        // 申领奖励
compound(bytes32 stakeId, uint256 additionalAmount) // 复利质押
```

## 🔍 合约交互

### 使用 Cast 命令行工具
```bash
# RWA20 代币交互
cast call <RWA20_ADDRESS> "name()(string)" --rpc-url $env:LOCAL_RPC_URL
cast call <RWA20_ADDRESS> "balanceOf(address)(uint256)" <WALLET_ADDRESS> --rpc-url $env:LOCAL_RPC_URL
cast send <RWA20_ADDRESS> "transfer(address,uint256)" <RECIPIENT> <AMOUNT> \
  --private-key $env:PRIVATE_KEY --rpc-url $env:LOCAL_RPC_URL

# RWA721 NFT 交互
cast call <RWA721_ADDRESS> "tokenURI(uint256)(string)" <TOKEN_ID> --rpc-url $env:LOCAL_RPC_URL
cast call <RWA721_ADDRESS> "ownerOf(uint256)(address)" <TOKEN_ID> --rpc-url $env:LOCAL_RPC_URL
cast send <RWA721_ADDRESS> "mintNFT(address,string)" <RECIPIENT> <TOKEN_URI> \
  --private-key $env:PRIVATE_KEY --rpc-url $env:LOCAL_RPC_URL

# RWAStaking 质押交互
cast call <RWA_STAKING_ADDRESS> "getUserStakes(address)(tuple[])" <USER_ADDRESS> --rpc-url $env:LOCAL_RPC_URL
cast send <RWA_STAKING_ADDRESS> "stake(uint256,uint256)" <AMOUNT> <LOCK_PERIOD> \
  --private-key $env:PRIVATE_KEY --rpc-url $env:LOCAL_RPC_URL
```

### 前端集成
合约 ABI 文件位于：
- `out/RWA20.sol/RWA20.json` - ERC20 代币合约
- `out/RWA721.sol/RWA721.json` - ERC721 NFT 合约
- `out/RWAStaking.sol/RWAStaking.json` - 质押合约

这些 ABI 文件可以用于前端 DApp 集成。

## 📝 测试覆盖

项目包含 54 个测试用例，覆盖：
- **RWA20 (23个测试)**: 基础 ERC20 功能、铸造、销毁、批量转账、白名单管理、暂停机制
- **RWA721 (15个测试)**: NFT 铸造、转移、元数据管理、版税设置、批量铸造
- **RWAStaking (16个测试)**: 质押功能、奖励计算、复利机制、紧急提取、多用户场景

运行测试：
```bash
# 所有测试
forge test

# 特定合约测试
forge test --match-contract RWA20Test
forge test --match-contract RWA721Test
forge test --match-contract RWAStakingTest

# Gas 使用分析
forge test --gas-report

# 详细输出
forge test -v --match-test testMint

# 性能测试
forge test --match-test testGasUsage
```

## 🔒 安全注意事项

1. **私钥管理**: 永远不要在代码或版本控制中存储真实私钥
2. **环境变量**: 使用 `.env` 文件管理敏感信息，并添加到 `.gitignore`
3. **合约审计**: 生产部署前必须进行专业安全审计
4. **测试验证**: 在测试网充分测试后再部署到主网
5. **监控**: 部署后建立监控和告警机制
6. **重入保护**: 所有合约都集成了 ReentrancyGuard 防护
7. **权限控制**: 严格的所有权控制，确保只有授权用户可以执行关键操作

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 支持

如有问题或建议，请：
- 创建 Issue
- 发送邮件
- 加入社区讨论

---

**注意**: 这是一个完整的现实世界资产代币化系统，包含多个智能合约。在生产环境使用前请进行充分的安全审计和测试。

## 📈 项目状态

- ✅ **第一阶段完成**: RWA20 ERC20 代币合约
- ✅ **第二阶段完成**: RWA721 NFT 合约 + RWAStaking 质押合约
- 📋 **第三阶段计划**: ERC1155 多代币标准、跨链支持、合规功能

**总测试用例**: 54个  
**Gas 优化**: 所有合约都经过 Gas 优化  
**安全审计**: 使用 OpenZeppelin 标准库，集成多重安全机制
