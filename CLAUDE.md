# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# PP-RWA - 现实世界资产代币化系统

## 项目概述

这是一个基于区块链技术的综合性现实世界资产（RWA）代币化系统。该项目旨在将传统资产（房地产、债券、商品、艺术品等）代币化，使其能够在区块链网络上进行交易、管理和转移，从而提高流动性、透明度并降低交易成本。

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
- **语言**: Solidity ^0.8.13
- **测试**: Foundry 测试框架，支持模糊测试
- **标准**: 计划支持多种 ERC 标准 (ERC-20, ERC-721, ERC-1155, ERC-3643)
- **库**: OpenZeppelin (通过 forge-std)

### 后端 (pp-rwa-backend)
- **状态**: 当前为空 - 计划未来开发
- **计划技术栈**: Node.js/TypeScript, The Graph, PostgreSQL/MongoDB, Redis

### 文档
- **需求**: 中文综合需求规格说明
- **技术设计**: 详细技术架构和实现指南

## 项目结构

```
pp-rwa/
├── pp-rwa-frontend/          # Next.js DApp
│   ├── src/
│   │   └── app/             # App Router 结构
│   │       ├── layout.tsx   # 根布局，包含 Geist 字体
│   │       └── page.tsx     # 首页
│   ├── public/              # 静态资源
│   ├── package.json         # 依赖和脚本
│   ├── tsconfig.json        # TypeScript 配置
│   ├── next.config.ts       # Next.js 配置
│   └── eslint.config.mjs    # ESLint 配置
├── pp-rwa-contract/         # Foundry 智能合约
│   ├── src/
│   │   └── Counter.sol      # 示例合约
│   ├── script/
│   │   └── Counter.s.sol    # 部署脚本
│   ├── test/
│   │   └── Counter.t.sol    # 测试套件
│   ├── foundry.toml        # Foundry 配置
│   └── lib/                 # 外部库 (forge-std)
├── pp-rwa-backend/          # 后端服务 (空)
└── docs/                    # 项目文档
    ├── requirements.md      # 功能需求
    └── tech-design.md       # 技术设计文档
```

## 核心功能 (计划中)

### 智能合约层
- **多代币标准**: ERC-20 (同质化), ERC-721 (NFT), ERC-1155 (多代币), ERC-3643 (合规)
- **DeFi 集成**: 质押、流动性挖矿、借贷协议、AMM 交易
- **合规管理**: KYC/AML、投资者白名单、地域限制
- **跨链支持**: Chainlink CCIP 实现多链互操作性
- **Layer 2 支持**: Optimism 和 Arbitrum 提高可扩展性
- **预言机集成**: Chainlink 提供价格喂送和资产估值

### 前端 DApp
- **用户界面**: 仪表板、交易界面、质押界面、治理投票
- **钱包集成**: Web3 钱包连接支持
- **资产管理**: 代币和 NFT 投资组合管理
- **响应式设计**: 移动端友好，支持深色/浅色主题
- **实时更新**: 交易状态跟踪和通知

### 后端服务
- **数据索引**: The Graph 进行区块链数据索引
- **API 服务**: RESTful/GraphQL API 供前端集成
- **合规服务**: KYC/AML 集成和投资者验证
- **监控**: 系统健康监控和性能指标

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
forge fmt           # 格式化代码
forge script script/Counter.s.sol:CounterScript --broadcast  # 部署
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

### 已完成
- ✅ 使用 Next.js 15 的前端样板设置
- ✅ 使用 Foundry 的智能合约开发环境
- ✅ 基础示例合约 (Counter) 及测试
- ✅ 综合需求和技术设计文档

### 进行中
- 🔄 前端 DApp 开发 (基础结构已完成)
- 🔄 智能合约实现 (从基础合约开始)

### 计划中
- 📋 后端服务开发
- 📋 完整的代币标准实现
- 📋 DeFi 集成功能
- 📋 跨链和 L2 支持
- 📋 合规和监管功能
- 📋 生产部署和监控

## 重要说明

- 这是一个需要严格合规的复杂金融系统
- 所有智能合约在生产前必须经过全面的安全审计
- 后端服务目前处于规划阶段
- 项目采用模块化架构以确保可扩展性和可维护性
- 计划支持多语言 (需求文档为中文)

## 开发环境设置

1. **前端**: 需要 Node.js 和 npm/yarn
2. **智能合约**: 需要 Foundry 工具包 (使用 `foundryup` 安装)
3. **后端**: Node.js/TypeScript 环境 (开发时)
4. **数据库**: PostgreSQL/MongoDB (后端开发时)
5. **基础设施**: 计划支持 Docker 容器化

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

# 代码检查
cd pp-rwa-frontend && npm run lint
```
- unicode character is not allowed in log and comments. use english
- 执行check等操作时，等于引入的第三方库的内容，可以跳过。除非第三方库的输出和逻辑跟预期不符需要排查时，以及自定义实现逻辑依赖第三方库，但是我们又不清楚第三方库的逻辑时，才需要校验第三方库的逻辑
- 原则上不要自己启动本地服务。如果确实有测试校验的需求，那么校验测试完毕后记得关闭服务。因为在当前claude窗口内，你启动服务后，没有校验，也没有关闭的简单命令。我会在另外的终端窗口自行启动服务验证。