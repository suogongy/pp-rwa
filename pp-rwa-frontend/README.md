# RWA 代币系统前端

这是一个基于 [Next.js](https://nextjs.org) 构建的 Web3 前端应用，用于与 RWA（现实世界资产）代币化智能合约进行交互。该项目是使用 [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) 初始化的。

## 项目概述

RWA 代币系统是一个完整的现实世界资产代币化演示平台，允许用户将现实世界中的资产（如房地产、债券、商品等）通过区块链技术进行代币化。该平台提供了完整的智能合约和前端界面，支持资产的创建、转移、查询等功能。

## 技术栈

- [Next.js](https://nextjs.org) - React 框架（v15.5.2）
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [wagmi](https://wagmi.sh/) - React Hooks 库（v2.16.9）
- [viem](https://viem.sh/) - 以太坊开发库（v2.37.4）
- [RainbowKit](https://www.rainbowkit.com/) - 钱包连接组件（v2.2.8）
- [Solidity](https://soliditylang.org/) - 智能合约编程语言

## 功能特性

- 钱包连接（支持主流 Web3 钱包）
- 代币信息查询（名称、符号、余额等）
- 代币转账功能
- 代币铸造功能（仅限合约所有者）
- 响应式用户界面
- Gas 优化和安全最佳实践

## 环境要求

- Node.js 18.17 或更高版本
- npm、yarn、pnpm 或 bun 包管理器

## 快速开始

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
# 或
bun install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
# 或
bun dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
# 或
yarn build
# 或
pnpm build
# 或
bun build
```

### 启动生产服务器

```bash
npm run start
# 或
yarn start
# 或
pnpm start
# 或
bun start
```

## 项目结构

```
pp-rwa-frontend/
├── src/
│   ├── app/                 # 应用路由和页面
│   ├── components/          # React 组件
│   │   ├── ui/              # UI 组件库
│   │   ├── Providers.tsx    # 应用提供者
│   │   ├── TokenActions.tsx # 代币操作组件
│   │   └── WalletConnect.tsx # 钱包连接组件
│   └── lib/                 # 工具库和配置
│       ├── wagmi.ts         # wagmi 配置
│       └── utils.ts         # 工具函数
├── public/                  # 静态资源
├── next.config.ts           # Next.js 配置
├── tailwind.config.ts       # Tailwind CSS 配置
└── package.json             # 项目依赖和脚本
```

## 智能合约集成

该项目与基于 Solidity 的 RWA20 智能合约进行交互，合约具有以下功能：

- 标准 ERC-20 代币功能（转账、余额查询、授权等）
- 所有者权限控制（铸造新代币）
- 95%+ 测试覆盖率
- Gas 优化实现

## 开发说明

你可以通过修改 `src/app/page.tsx` 文件来编辑主页。页面会在你编辑文件时自动更新。

本项目使用 [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) 自动优化并加载 [Geist](https://vercel.com/font) 字体，这是 Vercel 推出的新字体系列。

## 学习资源

了解更多关于所用技术的信息，请查看以下资源：

- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 特性和 API
- [Learn Next.js](https://nextjs.org/learn) - 交互式 Next.js 教程
- [wagmi 文档](https://wagmi.sh/) - wagmi React Hooks 库文档
- [Solidity 文档](https://docs.soliditylang.org/) - Solidity 智能合约语言文档

## 部署

部署 Next.js 应用最简单的方式是使用 [Vercel 平台](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)，这是 Next.js 团队创建的平台。

你也可以查看 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 获取更多部署选项。

## 许可证

该项目仅供学习和演示目的使用。