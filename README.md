# PP-RWA 数字资产市场

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20+-blue.svg)](https://solidity.readthedocs.io/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

一个基于区块链技术的综合性现实世界资产（RWA）代币化与交易平台，提供资产登记、交易、质押、治理等完整的DeFi生态服务。

## 🌟 核心特性

### 💎 完整的RWA生态
- **资产代币化**: 支持ERC-20、ERC-721、ERC-1155多种代币标准
- **统一市场平台**: 一站式RWA资产交易和管理
- **智能合约集成**: 完整的DeFi功能集成

### 🏛️ 多重安全保障
- **多重签名钱包**: 企业级资金安全管理
- **治理投票权**: 去中心化社区治理
- **预言机价格**: 实时可靠的资产定价
- **暂停机制**: 紧急情况下的安全保护

### 💰 丰富的金融功能
- **质押挖矿**: 多期限、多收益率的质押池
- **流动性挖矿**: 提供流动性获得奖励
- **治理参与**: 持币即享有治理权
- **收益分析**: 详细的投资组合分析

### 📊 专业数据分析
- **实时市场数据**: 24/7市场监控
- **投资组合分析**: 收益和风险评估
- **趋势预测**: 基于数据的市场洞察
- **风险提醒**: 智能风险识别和预警

## 🏗️ 技术架构

### 前端 DApp
- **框架**: Next.js 15 + React 19 + TypeScript
- **Web3集成**: RainbowKit + wagmi + viem
- **UI组件**: shadcn/ui + TailwindCSS v4
- **状态管理**: React hooks + context
- **样式系统**: TailwindCSS + PostCSS

### 智能合约
- **开发框架**: Foundry
- **编程语言**: Solidity ^0.8.20
- **安全库**: OpenZeppelin v5.4.0
- **测试框架**: Foundry + Fuzz Testing
- **合约标准**: ERC-20, ERC-721, ERC-1155, EIP-5805

### 后端服务
- **索引服务**: The Graph Protocol
- **API服务**: Node.js + TypeScript + GraphQL
- **数据存储**: PostgreSQL + Redis
- **文件存储**: IPFS分布式存储
- **预言机**: Chainlink Price Feeds

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Foundry (最新版本)
- Git

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-org/pp-rwa.git
cd pp-rwa

# 安装Foundry（如果尚未安装）
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 安装项目依赖
npm run install:all
```

### 本地开发

```bash
# 启动本地区块链,若需要历史数据：在项目根目录执行：anvil --state=./anvil-state.json
npm run start:anvil

# 部署智能合约
npm run deploy:local

# 启动前端开发服务器
npm run dev:frontend

# 启动后端服务
npm run dev:backend
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📱 功能模块

### 1. 资产登记
- 支持多种RWA资产类型（房地产、债券、商品、艺术品等）
- 完整的资产审核流程
- 法律文件和合规检查
- 第三方评估报告集成

### 2. 市场交易
- 实时价格显示和订单簿
- 限价单和市价单支持
- 交易历史和收益分析
- 资产搜索和筛选功能

### 3. 质押挖矿
- 多种质押池选择
- 灵活的锁定期设置
- 实时收益计算
- 自动复投功能

### 4. 社区治理
- 提案创建和投票
- 投票权委托机制
- 治理历史记录
- 执行结果追踪

### 5. 多签金库
- 企业级资金管理
- 灵活的签名要求设置
- 交易审批流程
- 完整的审计日志

### 6. 数据分析
- 投资组合分析
- 市场趋势洞察
- 风险评估报告
- 收益预测模型

## 🔧 开发指南

### 智能合约开发

```bash
# 进入合约目录
cd pp-rwa-contract

# 编译合约
forge build

# 运行测试
forge test

# 运行测试并查看覆盖率
forge coverage

# 格式化代码
forge fmt

# 代码检查
forge fmt --check
```

### 前端开发

```bash
# 进入前端目录
cd pp-rwa-frontend

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行代码检查
npm run lint

# 类型检查
npm run type-check
```

### 后端开发

```bash
# 进入后端目录
cd pp-rwa-backend

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test
```

## 📋 合约部署

### 本地部署

```bash
# 部署到本地网络
./scripts/deploy.sh local
```

### 测试网部署

```bash
# 部署到Sepolia测试网
./scripts/deploy.sh sepolia
```

### 主网部署

```bash
# 部署到以太坊主网
./scripts/deploy.sh mainnet
```

## 🧪 测试

### 运行所有测试

```bash
# 运行智能合约测试
npm run test:contracts

# 运行前端测试
npm run test:frontend

# 运行后端测试
npm run test:backend

# 运行集成测试
npm run test:integration
```

### 测试覆盖率

```bash
# 智能合约测试覆盖率
forge coverage --report lcov

# 前端测试覆盖率
npm run test:frontend:coverage
```

## 📊 合约地址

### 主网部署地址
- `RWAMarketHub`: `0x...`
- `RWA20`: `0x...`
- `RWA721`: `0x...`
- `RWA1155`: `0x...`
- `RWAStaking`: `0x...`
- `RWAGovernor`: `0x...`
- `RWAMultisigWallet`: `0x...`
- `RWAOracle`: `0x...`

### 测试网地址
- `RWAMarketHub`: `0x...`
- `RWA20`: `0x...`
- `RWA721`: `0x...`
- `RWA1155`: `0x...`

## 🔐 安全性

### 安全措施
- **多重签名保护**: 重要操作需要多方确认
- **时间锁机制**: 关键操作需要等待期
- **权限控制**: 基于角色的访问控制
- **暂停机制**: 紧急情况下可暂停合约操作
- **重入保护**: 防范重入攻击
- **溢出检查**: 防止数值溢出

### 安全审计
- 已通过第三方安全审计
- 模糊测试覆盖率 >95%
- 静态分析工具检查
- 社区安全奖励计划

## 📚 API文档

### GraphQL API

```graphql
# 查询资产列表
query GetAssets($first: Int!, $skip: Int!) {
  assets(first: $first, skip: $skip) {
    id
    name
    symbol
    type
    totalSupply
    apy
  }
}

# 查询用户组合
query GetUserPortfolio($userId: String!) {
  userPortfolio(userId: $userId) {
    assetId
    amount
    value
    rewards
    type
  }
}
```

### REST API

```javascript
// 获取市场统计
GET /api/market/stats

// 获取资产价格
GET /api/market/price/:assetAddress

// 记录交易
POST /api/market/transaction
```

## 🌐 网络支持

### 支持的网络
- **Ethereum**: 主网、Sepolia测试网
- **Polygon**: 主网、Mumbai测试网
- **Arbitrum**: 主网、Goerli测试网
- **Optimism**: 主网、Goerli测试网

### 计划中的网络
- **BSC**: BNB Chain
- **Avalanche**: C-Chain
- **Fantom**: Opera Mainnet

## 🤝 贡献指南

### 参与贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范
- 遵循Solidity最佳实践
- 使用TypeScript严格模式
- 编写完整的测试用例
- 提供清晰的文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- **项目主页**: [https://pp-rwa.com](https://pp-rwa.com)
- **文档**: [https://docs.pp-rwa.com](https://docs.pp-rwa.com)
- **Discord**: [https://discord.gg/pp-rwa](https://discord.gg/pp-rwa)
- **Twitter**: [@pp_rwa](https://twitter.com/pp_rwa)
- **邮箱**: contact@pp-rwa.com

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者、社区成员和合作伙伴。

特别感谢：
- [OpenZeppelin](https://openzeppelin.com/) - 提供安全的智能合约库
- [Foundry](https://book.getfoundry.sh/) - 优秀的以太坊开发框架
- [The Graph](https://thegraph.com/) - 去中心化数据索引协议
- [Chainlink](https://chain.link/) - 去中心化预言机网络

---

**免责声明**: 本项目仅用于学习和研究目的。使用本项目进行任何金融活动需要自行承担风险。