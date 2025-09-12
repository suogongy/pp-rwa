# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# PP-RWA - 现实世界资产代币化系统

## 项目概述

这是一个基于区块链技术的综合性现实世界资产（RWA）代币化系统。该项目旨在将传统资产（房地产、债券、商品、艺术品等）代币化，使其能够在区块链网络上进行交易、管理和转移，从而提高流动性、透明度并降低交易成本。

**当前状态**: 第一阶段已完成，实现了完整的ERC-20代币系统、现代化Web3前端和部署基础设施。

## 语言设置

**重要提示：** 在此代码库中，所有与用户的交流、代码注释、文档和输出都必须使用中文。这是项目的官方语言要求。

## 技术栈

### 前端 (pp-rwa-frontend)
- **框架**: Next.js 15.5.2 与 React 19.1.0
- **语言**: TypeScript 启用严格模式
- **样式**: TailwindCSS v4 与 PostCSS
- **构建工具**: Next.js 与 Turbopack 优化开发
- **代码检查**: ESLint 与 Next.js 配置
- **架构**: App Router 与 Server Components

### 智能合约 (pp-rwa-contract)
- **框架**: Foundry (基于 Rust 的以太坊开发框架)
- **语言**: Solidity ^0.8.19
- **测试**: Foundry 测试框架，支持模糊测试
- **库**: OpenZeppelin v5.4.0
- **已完成**: RWA20 (ERC-20代币)，包含高级功能如批量转账、白名单管理、暂停机制
- **进行中**: RWA721 (ERC-721代币)，RWAStaking (质押合约)

### 后端 (pp-rwa-backend)
- **状态**: 开发中 - The Graph 子图索引服务
- **技术栈**: Node.js/TypeScript, The Graph Protocol
- **功能**: 区块链数据索引，GraphQL API
- **已完成**: 子图配置，schema定义，索引服务

### 文档
- **需求**: 中文综合需求规格说明
- **技术设计**: 详细技术架构和实现指南

## 项目结构

```
pp-rwa/
├── pp-rwa-frontend/          # Next.js DApp
│   ├── src/
│   │   ├── app/             # App Router 结构
│   │   │   ├── layout.tsx   # 根布局
│   │   │   └── page.tsx     # 首页
│   │   ├── components/      # UI 组件库
│   │   └── lib/             # 工具库和配置
│   ├── public/              # 静态资源
│   ├── package.json         # 依赖和脚本
│   ├── tsconfig.json        # TypeScript 配置
│   ├── next.config.ts       # Next.js 配置
│   └── eslint.config.mjs    # ESLint 配置
├── pp-rwa-contract/         # Foundry 智能合约
│   ├── src/
│   │   ├── RWA20.sol        # ERC-20 代币合约
│   │   ├── RWA721.sol       # ERC-721 代币合约
│   │   └── RWAStaking.sol   # 质押合约
│   ├── script/
│   │   └── DeployRWA20.s.sol # 部署脚本
│   ├── test/
│   │   └── RWA20.t.sol      # 测试套件
│   ├── foundry.toml        # Foundry 配置
│   └── lib/                 # 外部库 (OpenZeppelin, forge-std)
├── pp-rwa-backend/          # 后端服务
│   ├── src/
│   │   └── index.ts         # The Graph 索引服务
│   ├── subgraph/
│   │   ├── schema.graphql   # GraphQL Schema
│   │   └── src/             # 子图源码
│   ├── graph-node/          # Graph Node 配置
│   └── guides/              # 部署和维护指南
├── docs/                    # 项目文档
│   ├── requirements.md      # 功能需求
│   ├── tech-design.md       # 技术设计文档
│   ├── development-plan.md  # 开发计划
│   ├── tech-stack-guide.md  # 技术栈指南
│   ├── PHASE1-COMPLETION.md     # 第一阶段完成报告
│   ├── PHASE2-COMPLETION.md     # 第二阶段完成报告
│   ├── OPENZEPPELIN_INTEGRATION_REPORT.md # OpenZeppelin集成报告

```

## 核心功能

### 已完成功能 (第一阶段)

#### 智能合约层
- ✅ **RWA20代币合约**: 完整的ERC-20实现
  - 标准ERC-20功能 (transfer, approve, balanceOf等)
  - 高级功能: 铸造(mint)、销毁(burn)、批量转账(batchTransfer)
  - 安全机制: 白名单管理、暂停/恢复功能、所有权控制
  - Gas优化: 使用最小化存储和高效算法
- ✅ **完整测试套件**: 23个测试用例，95%+覆盖率
- ✅ **多环境部署**: 本地、Sepolia测试网、主网支持

#### 前端 DApp
- ✅ **现代化架构**: Next.js 15 + React 19 + TypeScript
- ✅ **Web3集成**: RainbowKit + wagmi + viem
- ✅ **用户界面**: 响应式设计和现代UI
  - 代币信息展示和钱包连接
  - 代币转账、铸造、销毁功能
  - 所有权管理界面
- ✅ **UI组件库**: shadcn/ui + TailwindCSS

#### 后端服务
- ✅ **The Graph索引**: 区块链数据索引服务
- ✅ **GraphQL API**: 数据查询接口
- ✅ **子图配置**: 完整的schema和映射

### 进行中功能 (第二阶段)

#### 智能合约层
- 🔄 **RWA721代币**: ERC-721 NFT标准实现
- 🔄 **RWAStaking**: 代币质押合约
- 🔄 **DeFi集成**: 流动性池和收益农场

#### 后端服务
- 🔄 **API服务扩展**: 更多数据索引功能
- 🔄 **监控服务**: 系统健康监控

### 计划中功能

#### 智能合约层
- 📋 **ERC-1155**: 多代币标准支持
- 📋 **合规管理**: KYC/AML、投资者白名单、地域限制
- 📋 **跨链支持**: Chainlink CCIP 实现多链互操作性
- 📋 **Layer 2 支持**: Optimism 和 Arbitrum
- 📋 **预言机集成**: Chainlink 价格喂送和资产估值

#### 前端 DApp
- 📋 **高级界面**: 质押界面、治理投票、NFT管理
- 📋 **实时更新**: 交易状态跟踪和通知
- 📋 **多语言支持**: 国际化功能

#### 后端服务
- 📋 **合规服务**: KYC/AML 集成和投资者验证
- 📋 **分析服务**: 数据分析和报告
- 📋 **微服务架构**: 扩展性和可维护性

## 开发命令

### 前端开发
```bash
cd pp-rwa-frontend
npm run dev          # 使用 Turbopack 启动开发服务器
npm run build        # 使用 Turbopack 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
```

### 智能合约开发
```bash
cd pp-rwa-contract
forge build          # 构建合约
forge test          # 运行测试
forge test -v        # 详细测试输出
forge test --gas-report # Gas使用分析
forge fmt           # 格式化代码
forge fmt --check   # 检查格式
```

### 合约部署
```bash
# 本地部署
./deploy.sh local

# Sepolia测试网部署
./deploy.sh sepolia

# 主网部署
./deploy.sh mainnet
```

### 后端服务
```bash
cd pp-rwa-backend
npm install         # 安装依赖
npm run dev         # 启动开发服务器
npm run build       # 构建生产版本
```

## 架构模式

### 智能合约架构
- **代理模式**: 用于可升级合约
- **访问控制**: Ownable 和基于角色的权限
- **合规设计**: 内置监管要求
- **模块化设计**: 不同功能使用独立合约

### 前端架构
- **服务端组件**: Next.js App Router 与 React Server Components
- **基于组件的 UI**: 模块化组件结构
- **类型安全**: 完整的 TypeScript 集成
- **状态管理**: React hooks 和 context 进行状态管理

### 系统架构
- **多链**: 支持以太坊 L1 和多个 L2 网络
- **微服务**: 不同功能使用独立服务
- **事件驱动**: 区块链事件触发后端进程
- **可扩展**: 支持负载均衡的水平扩展

## 开发指南

### 代码风格
- **TypeScript**: 启用严格模式，禁止隐式 any
- **Solidity**: ^0.8.13 遵循 OpenZeppelin 约定
- **ESLint**: Next.js core-web-vitals 配置
- **格式化**: 所有组件保持一致的格式化

### 测试策略
- **单元测试**: 所有组件的全面单元测试
- **集成测试**: 端到端测试工作流
- **模糊测试**: 智能合约的属性测试
- **安全审计**: 定期安全审查和审计

### 安全考虑
- **访问控制**: 适当的权限管理
- **输入验证**: 全面的输入验证和清理
- **重入保护**: 防范重入攻击
- **Gas 优化**: 高效的 Gas 使用模式

## 当前状态

### 第一阶段已完成 ✅
- ✅ **智能合约**: RWA20代币合约，包含完整测试套件
- ✅ **前端DApp**: 现代化Web3应用，支持钱包连接和代币操作
- ✅ **后端服务**: The Graph索引服务和GraphQL API
- ✅ **部署基础设施**: 自动化部署脚本，支持多环境
- ✅ **CI/CD流水线**: GitHub Actions自动化测试和部署
- ✅ **文档**: 完整的技术文档和部署指南

### 第二阶段已完成 ✅
- ✅ **RWA721**: 完整的ERC-721 NFT代币合约，包含版税管理、批量铸造等高级功能
- ✅ **RWAStaking**: 灵活的代币质押系统，支持多期限和动态奖励
- ✅ **完整测试套件**: 43个测试用例，95%+覆盖率
- ✅ **前端扩展**: NFT管理和质押管理界面
- ✅ **部署脚本**: 支持多环境部署的完整部署基础设施

### 第三阶段计划中 📋
- 📋 **ERC-1155**: 多代币标准支持
- 📋 **跨链支持**: Chainlink CCIP多链互操作
- 📋 **Layer 2集成**: Optimism和Arbitrum支持
- 📋 **合规功能**: KYC/AML集成和监管合规
- 📋 **高级DeFi**: 借贷、期权等复杂金融产品
- 📋 **治理系统**: DAO治理和投票机制

## 重要说明

- 这是一个需要严格合规的复杂金融系统
- 所有智能合约在生产前必须经过全面的安全审计
- 项目采用模块化架构以确保可扩展性和可维护性
- 第一阶段已完成，具备生产级代码质量
- 项目包含完整的开发工具链和部署流程
- 所有代码注释和文档使用中文，符合项目语言要求

## 开发环境设置

1. **前端**: 需要 Node.js 和 npm/yarn
2. **智能合约**: 需要 Foundry 工具包 (使用 `foundryup` 安装)
3. **后端**: Node.js/TypeScript 环境，The Graph CLI
4. **数据库**: The Graph Node (区块链索引)
5. **基础设施**: Docker 容器化支持
6. **钱包**: MetaMask 或其他Web3钱包用于测试

## 贡献指南

- 遵循既定的代码模式和约定
- 确保所有更改都有全面的测试覆盖
- 为任何新功能或修改更新文档
- 遵循安全最佳实践，特别是智能合约
- 考虑所有金融功能的监管影响

## Claude Code 使用指南

### 语言要求
**重要：** 在此项目中，Claude Code 必须始终使用中文与用户交流，包括：
- 所有响应和解释
- 代码注释
- 文档更新
- 错误信息
- 日志输出

### 开发规范
- 所有代码注释必须使用中文
- 提交信息建议使用中文
- 文档更新必须使用中文
- 与用户的交流必须使用中文

### 常用命令
```bash
# 前端开发
cd pp-rwa-frontend && npm run dev

# 智能合约开发
cd pp-rwa-contract && forge test

# 合约部署
./deploy.sh local

# 代码检查
cd pp-rwa-frontend && npm run lint

# 后端服务
cd pp-rwa-backend && npm run dev
```

### 部署脚本使用
项目包含自动化部署脚本 `deploy.sh`，支持：
- `./deploy.sh local` - 本地开发环境部署
- `./deploy.sh sepolia` - Sepolia测试网部署
- `./deploy.sh mainnet` - 以太坊主网部署

### 环境变量配置
每个子项目都有 `.env.example` 文件，复制为 `.env` 并配置相应参数：
- RPC URL
- 私钥
- API密钥
- 网络配置
- unicode character is not allowed in log and comments. use english
- 执行check等操作时，等于引入的第三方库的内容，可以跳过。除非第三方库的输出和逻辑跟预期不符需要排查时，以及自定义实现逻辑依赖第三方库，但是我们又不清楚第三方库的逻辑时，才需要校验第三方库的逻辑
- 原则上不要自己启动本地服务。如果确实有测试校验的需求，那么校验测试完毕后记得关闭服务。因为在当前claude窗口内，你启动服务后，没有校验，也没有关闭的简单命令。我会在另外的终端窗口自行启动服务验证。
- 禁止添加sh等脚本文件
- 所有日志输出中，只用普通文本，避免使用emoji等特殊字符