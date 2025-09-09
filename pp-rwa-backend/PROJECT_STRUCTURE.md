# 📁 PP-RWA Backend 项目结构

## 🏗️ 整体架构

```
pp-rwa-backend/
├── graph-node/                    # Graph Node区块链索引服务
│   ├── docker/
│   │   └── docker-compose.yml    # Docker Compose配置
│   ├── data/                     # 数据持久化目录
│   └── README.md                 # Graph Node使用说明
├── src/                          # 后端API服务源码
│   └── index.ts                  # Express API服务器
├── subgraph/                     # The Graph子图配置
│   ├── schema.graphql           # GraphQL数据模型
│   ├── subgraph.yaml            # 子图配置文件
│   └── src/
│       └── rwa20-mapping.ts     # 事件处理逻辑
├── guides/                       # 详细配置指南
│   ├── ENVIRONMENT_CONFIG_GUIDE.md
│   ├── THE_GRAPH_CONFIG_GUIDE.md
│   └── SUBGRAPH_DEPLOYMENT_GUIDE.md
├── .env.example                  # 环境变量模板
├── .env.local                    # 本地开发环境配置
├── .env.sepolia                  # Sepolia测试网配置
├── package.json                  # 项目依赖
├── tsconfig.json                 # TypeScript配置
├── .gitignore                    # Git忽略文件
└── README.md                     # 项目说明文档
```

## 🎯 模块说明

### 📊 graph-node/
**Graph Node区块链索引服务**
- 提供区块链数据索引功能
- 包含Docker Compose配置
- 数据持久化存储

### 🔧 src/
**后端API服务**
- Express.js RESTful API
- 环境配置管理
- GraphQL客户端代理

### 📈 subgraph/
**The Graph子图配置**
- 定义数据模型和事件映射
- 监听RWA20合约事件
- 数据转换和存储逻辑

### 📚 guides/
**详细配置指南**
- 环境配置指南
- The Graph配置指南
- 子图部署指南

## 🚀 使用流程

1. **启动Graph Node**: `cd graph-node && docker-compose -f docker/docker-compose.yml up -d`
2. **配置环境**: 复制并修改`.env.local`或`.env.sepolia`
3. **部署子图**: 按照指南部署子图配置
4. **启动后端API**: `npm install && npm start`
5. **测试API**: 使用curl或Postman测试接口

## 🔗 模块关系

```
区块链网络 → Graph Node → 子图索引 → 后端API → 前端应用
```

这种模块化的结构使得：
- 各组件职责清晰
- 便于独立维护和升级
- 支持多环境部署
- 易于理解和扩展