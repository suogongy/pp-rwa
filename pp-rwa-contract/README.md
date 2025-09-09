# RWA20 - 现实世界资产代币化合约

基于 OpenZeppelin 标准库的高安全性、标准化的 ERC20 代币合约，专为现实世界资产（RWA）代币化而设计。

## 🌟 项目特性

### 🔒 安全性
- **OpenZeppelin v5.4.0**: 使用行业标准的、经过审计的安全库
- **多重防护**: 集成 Ownable、Pausable、ReentrancyGuard 安全模块
- **访问控制**: 完善的权限管理和白名单机制

### ⚡ 性能优化
- **Gas 优化**: 紧凑的存储布局和高效的算法
- **批量操作**: 支持最多100个地址的批量转账
- **事件优化**: 改进的事务ID生成机制

### 🚀 核心功能
- **标准 ERC20**: 完全兼容 ERC20 标准
- **铸造/销毁**: 灵活的代币供应管理
- **批量转账**: 高效的批量代币转移
- **白名单管理**: 增强的访问控制
- **暂停机制**: 紧急情况下的合约暂停
- **紧急提取**: 暂停状态下的资产保护

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

# 详细测试输出
forge test -v

# 生成 Gas 报告
forge snapshot
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

### 本地网络部署
```bash
# 启动本地节点（如果未运行）
anvil --host 0.0.0.0 --port 8545 &

# 部署合约
forge script script/DeployRWA20.s.sol:DeployRWA20 --rpc-url ${LOCAL_RPC_URL} --private-key ${PRIVATE_KEY} --broadcast
```

### Sepolia 测试网部署
```bash
# 部署到 Sepolia 测试网
forge script script/DeployRWA20.s.sol:DeployRWA20 \
  --rpc-url ${SEPOLIA_RPC_URL} \
  --private-key ${PRIVATE_KEY} \
  --broadcast \
  --verify \
  --etherscan-api-key ${ETHERSCAN_API_KEY}
```

### 主网部署
```bash
# 部署到以太坊主网
forge script script/DeployRWA20.s.sol:DeployRWA20 \
  --rpc-url ${MAINNET_RPC_URL} \
  --private-key ${PRIVATE_KEY} \
  --broadcast \
  --verify \
  --etherscan-api-key ${ETHERSCAN_API_KEY}
```

## 📊 合约信息

### 合约参数
- **代币名称**: 可配置（默认：Real World Asset Token）
- **代币符号**: 可配置（默认：RWA）
- **精度**: 18 位小数
- **初始供应量**: 1,000,000 代币

### 核心函数
```solidity
// 基础 ERC20 功能
transfer(address to, uint256 amount) returns (bool)
approve(address spender, uint256 amount) returns (bool)
transferFrom(address from, address to, uint256 amount) returns (bool)

// 扩展功能
mint(address to, uint256 amount) // 仅所有者
burn(uint256 amount)            // 任何人
batchTransfer(address[] calldata recipients, uint256[] calldata amounts)

// 管理功能
addToWhitelist(address account)      // 仅所有者
removeFromWhitelist(address account) // 仅所有者
pause()                             // 仅所有者
unpause()                           // 仅所有者
```

## 🔍 合约交互

### 使用 Cast 命令行工具
```bash
# 查询代币信息
cast call <CONTRACT_ADDRESS> "name()(string)" --rpc-url ${LOCAL_RPC_URL}
cast call <CONTRACT_ADDRESS> "symbol()(string)" --rpc-url ${LOCAL_RPC_URL}
cast call <CONTRACT_ADDRESS> "totalSupply()(uint256)" --rpc-url ${LOCAL_RPC_URL}

# 查询余额
cast call <CONTRACT_ADDRESS> "balanceOf(address)(uint256)" <WALLET_ADDRESS> --rpc-url ${LOCAL_RPC_URL}

# 发送交易（需要私钥）
cast send <CONTRACT_ADDRESS> "transfer(address,uint256)" <RECIPIENT> <AMOUNT> \
  --private-key ${PRIVATE_KEY} \
  --rpc-url ${LOCAL_RPC_URL}
```

### 前端集成
合约 ABI 文件位于 `out/RWA20.sol/RWA20.json`，可以用于前端 DApp 集成。

## 📝 测试覆盖

项目包含 23 个测试用例，覆盖：
- 基础 ERC20 功能
- 铸造和销毁
- 批量转账
- 白名单管理
- 暂停/恢复机制
- 权限控制
- 边界条件和错误处理

运行测试：
```bash
# 所有测试
forge test

# Gas 使用分析
forge test --gas-report

# 详细输出
forge test -v --match-test testMint
```

## 🔒 安全注意事项

1. **私钥管理**: 永远不要在代码或版本控制中存储真实私钥
2. **环境变量**: 使用 `.env` 文件管理敏感信息，并添加到 `.gitignore`
3. **合约审计**: 生产部署前必须进行专业安全审计
4. **测试验证**: 在测试网充分测试后再部署到主网
5. **监控**: 部署后建立监控和告警机制

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

**注意**: 这是一个用于技术演示的项目，在生产环境使用前请进行充分的安全审计和测试。
