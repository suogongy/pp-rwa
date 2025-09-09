# 📚 The Graph 配置和部署指南

## 🎯 概述

本指南详细介绍如何手动配置和部署 The Graph subgraph，帮助您理解每个步骤的原理和操作。

## 📋 The Graph 基础知识

### 什么是 The Graph？

The Graph 是一个用于索引和查询区块链数据的去中心化协议。它允许您：

- **监听智能合约事件**
- **索引区块链数据**
- **提供强大的 GraphQL 查询接口**

### 核心概念

- **Subgraph**: 定义如何索引和存储数据的配置
- **Schema**: 数据结构的 GraphQL 定义
- **Mapping**: 事件处理逻辑，将区块链事件转换为结构化数据
- **Deployment**: 将 subgraph 部署到 The Graph 网络

## 🛠️ 手动配置步骤

### 1. 安装 Graph CLI

```bash
# 全局安装 Graph CLI
npm install -g @graphprotocol/graph-cli

# 验证安装
graph --version
```

### 2. 初始化 Subgraph 项目

```bash
# 进入 subgraph 目录
cd pp-rwa-backend/subgraph

# 初始化 subgraph (如果需要重新创建)
# graph init --studio
```

### 3. 配置 Subgraph YAML 文件

#### 本地开发配置 (subgraph-local.yaml)

```yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: RWA20
    network: mainnet  # 本地开发使用 mainnet 网络
    source:
      address: "0xYourLocalContractAddress"  # 替换为您的本地合约地址
      abi: RWA20
      startBlock: 0
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Token
        - Transfer
        - Mint
        - Burn
        - BatchTransfer
        - WhitelistUpdate
      abis:
        - name: RWA20
          file: ./abis/RWA20.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,uint256)
          handler: handleTransfer
        - event: TokensMinted(indexed address,uint256,bytes32)
          handler: handleTokensMinted
        - event: TokensBurned(indexed address,uint256,bytes32)
          handler: handleTokensBurned
        - event: BatchTransferExecuted(indexed address,address[],uint256[],bytes32)
          handler: handleBatchTransferExecuted
        - event: WhitelistUpdated(indexed address,bool)
          handler: handleWhitelistUpdated
      file: ./src/rwa20-mapping.ts
```

#### Sepolia 测试配置 (subgraph.yaml)

```yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: RWA20
    network: sepolia  # Sepolia 测试网
    source:
      address: "0xYourSepoliaContractAddress"  # 替换为您的 Sepolia 合约地址
      abi: RWA20
      startBlock: 0
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Token
        - Transfer
        - Mint
        - Burn
        - BatchTransfer
        - WhitelistUpdate
      abis:
        - name: RWA20
          file: ./abis/RWA20.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,uint256)
          handler: handleTransfer
        - event: TokensMinted(indexed address,uint256,bytes32)
          handler: handleTokensMinted
        - event: TokensBurned(indexed address,uint256,bytes32)
          handler: handleTokensBurned
        - event: BatchTransferExecuted(indexed address,address[],uint256[],bytes32)
          handler: handleBatchTransferExecuted
        - event: WhitelistUpdated(indexed address,bool)
          handler: handleWhitelistUpdated
      file: ./src/rwa20-mapping.ts
```

### 4. 理解 GraphQL Schema

```graphql
# schema.graphql
type Token @entity {
  id: ID!
  address: Bytes!
  name: String!
  symbol: String!
  decimals: Int!
  totalSupply: BigInt!
  owner: Bytes!
  isPaused: Boolean!
  version: String!
  transfers: [Transfer!]! @derivedFrom(field: "token")
  mints: [Mint!]! @derivedFrom(field: "token")
  burns: [Burn!]! @derivedFrom(field: "token")
  batchTransfers: [BatchTransfer!]! @derivedFrom(field: "token")
  whitelistUpdates: [WhitelistUpdate!]! @derivedFrom(field: "token")
  createdAt: BigInt!
  updatedAt: BigInt!
}

type Transfer @entity {
  id: ID!
  token: Token!
  from: Bytes!
  to: Bytes!
  amount: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
  timestamp: BigInt!
}

# ... 其他实体定义
```

### 5. 理解映射逻辑

```typescript
// src/rwa20-mapping.ts
import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts"
import { Transfer, TokensMinted } from "../generated/RWA20/RWA20"
import { Token, Transfer as TransferEntity, Mint } from "../generated/schema"

// 处理 Transfer 事件
export function handleTransfer(event: Transfer): void {
  // 获取或创建 Token 实体
  let token = getOrCreateToken(event.address)
  
  // 创建 Transfer 实体
  let transferId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let transfer = new TransferEntity(transferId)
  
  // 设置字段值
  transfer.token = token.id
  transfer.from = event.params.from
  transfer.to = event.params.to
  transfer.amount = event.params.value
  transfer.blockNumber = event.block.number
  transfer.transactionHash = event.transaction.hash
  transfer.timestamp = event.block.timestamp
  
  // 保存到存储
  transfer.save()
  
  // 更新 token 的更新时间
  token.updatedAt = event.block.timestamp
  token.save()
}

// 辅助函数：获取或创建 Token
function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString())
  if (token == null) {
    token = new Token(address.toHexString())
    token.address = address
    token.createdAt = BigInt.zero()
    token.updatedAt = BigInt.zero()
    token.save()
  }
  return token
}
```

## 🚀 部署流程详解

### 本地部署（可选）

#### 1. 启动本地 Graph Node

```bash
# 使用 Docker 启动 (Linux/Mac)
docker run -d \
  --name graph-node \
  -p 8000:8000 \
  -p 8001:8001 \
  -p 8020:8020 \
  -p 8030:8030 \
  -p 8040:8040 \
  graphprotocol/graph-node

# 使用 Docker 启动 (Windows PowerShell)
docker run -d `
  --name graph-node `
  -p 8000:8000 `
  -p 8001:8001 `
  -p 8020:8020 `
  -p 8030:8030 `
  -p 8040:8040 `
  graphprotocol/graph-node

# 使用 Docker 启动 (Windows CMD)
docker run -d ^
  --name graph-node ^
  -p 8000:8000 ^
  -p 8001:8001 ^
  -p 8020:8020 ^
  -p 8030:8030 ^
  -p 8040:8040 ^
  graphprotocol/graph-node

# 验证启动
curl http://localhost:8000/
```

#### 2. 生成 AssemblyScript 代码

```bash
cd subgraph

# 生成代码
graph codegen --config subgraph-local.yaml
```

#### 3. 构建 Subgraph

```bash
# 构建
graph build --config subgraph-local.yaml
```

#### 4. 创建和部署

```bash
# 创建 subgraph
graph create --node http://localhost:8020 pp-rwa

# 部署
graph deploy --node http://localhost:8020 pp-rwa
```

### The Graph Hosted Service 部署

#### 1. 准备工作

1. **访问 The Graph Studio**: https://thegraph.com/studio/
2. **连接钱包**: 使用 MetaMask 或其他钱包连接
3. **创建新项目**: 点击 "Create" 按钮
4. **记录项目名称**: 格式为 `username/project-name`

#### 2. 身份验证

```bash
# 获取访问令牌
# 在 The Graph Studio 项目页面找到 "Access Token"

# 身份验证
graph auth https://api.thegraph.com/deploy/ YOUR_ACCESS_TOKEN
```

#### 3. 配置生产环境文件

```bash
# 复制配置文件
cp subgraph.yaml subgraph-production.yaml

# 编辑生产配置
# 修改网络为 sepolia
# 更新合约地址为 Sepolia 合约地址
```

#### 4. 生成和构建

```bash
# 生成代码
graph codegen --config subgraph.yaml

# 构建
graph build --config subgraph.yaml
```

#### 5. 创建 Subgraph

```bash
# 创建 subgraph（只需要一次）
graph create --node https://api.thegraph.com/deploy/ your-username/your-project-name
```

#### 6. 部署到 Hosted Service

```bash
# 部署
graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ your-username/your-project-name
```

## 🔍 验证和测试

### 检查部署状态

```bash
# 检查 subgraph 状态
curl https://api.thegraph.com/subgraphs/name/your-username/your-project-name

# 响应应该包含：
{
  "data": {
    "meta": {
      "deployment": "当前部署哈希",
      "signalled": true,
      "synced": true  # 应该为 true 表示已同步
    }
  }
}
```

### 测试 GraphQL 查询

```bash
# 测试查询
curl -X POST https://api.thegraph.com/subgraphs/name/your-username/your-project-name \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ tokens { id address name symbol } }"
  }'

# 测试转移查询
curl -X POST https://api.thegraph.com/subgraphs/name/your-username/your-project-name \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { transfers(first: 5) { id from to amount timestamp } }"
  }'
```

### 使用 GraphiQL 测试

1. **访问 Playground**: https://thegraph.com/hosted-service/subgraph/your-username/your-project-name
2. **运行测试查询**:
```graphql
# 查询所有代币
query {
  tokens {
    id
    address
    name
    symbol
    totalSupply
  }
}

# 查询最近的转账
query {
  transfers(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    from
    to
    amount
    timestamp
    token {
      name
      symbol
    }
  }
}
```

## 🛠️ 故障排除

### 常见问题

#### 1. 代码生成失败

```bash
# 错误：Cannot find module 'assemblyscript'
# 解决：安装 AssemblyScript
npm install -g assemblyscript

# 错误：ABI 文件不存在
# 解决：确保 ABI 文件路径正确
ls abis/RWA20.json
```

#### 2. 构建失败

```bash
# 错误：TypeScript 编译错误
# 解决：检查映射文件语法
graph build --verbose

# 错误：YAML 格式错误
# 解决：验证 YAML 语法
npm install -g yaml-lint
yaml-lint subgraph.yaml
```

#### 3. 部署失败

```bash
# 错误：认证失败
# 解决：重新认证
graph auth https://api.thegraph.com/deploy/ YOUR_NEW_TOKEN

# 错误：subgraph 已存在
# 解决：直接部署，无需重新创建
graph deploy --node https://api.thegraph.com/deploy/ your-username/your-project-name
```

#### 4. 同步问题

```bash
# 问题：subgraph 一直同步中
# 原因：合约地址错误或无事件
# 解决：
# 1. 验证合约地址
# 2. 确认合约有交易事件
# 3. 检查 startBlock 设置
```

### 调试技巧

#### 1. 使用 Graph Node 日志

```bash
# 查看 Graph Node 日志
docker logs graph-node

# 实时查看日志
docker logs -f graph-node
```

#### 2. 本地测试

```bash
# 在本地测试 subgraph
graph deploy --node http://localhost:8020 --debug pp-rwa-local
```

#### 3. 验证事件监听

```bash
# 检查合约事件
cast logs 0xYourContractAddress --rpc-url https://sepolia.infura.io/v3/YOUR_KEY
```

## 📚 最佳实践

### 1. 版本控制

```bash
# 提交重要更改到 Git
git add .
git commit -m "Update subgraph configuration for Sepolia deployment"

# 标记重要版本
git tag -a v1.0.0 -m "Initial Sepolia deployment"
```

### 2. 配置管理

```bash
# 使用不同的配置文件
ls subgraph*.yaml

# 为每个环境创建单独的配置
cp subgraph.yaml subgraph-staging.yaml
cp subgraph.yaml subgraph-production.yaml
```

### 3. 监控和日志

```bash
# 定期检查同步状态
curl -s https://api.thegraph.com/subgraphs/name/your-username/your-project-name | jq '.data.meta.synced'

# 设置监控脚本
#!/bin/bash
if curl -s https://api.thegraph.com/subgraphs/name/your-username/your-project-name | jq -r '.data.meta.synced' | grep -q false; then
    echo "Subgraph is not synced!"
    # 发送告警
fi
```

## 🎯 学习要点

通过手动配置和部署，您将学习到：

1. **The Graph 协议原理**: 理解去中心化数据索引的工作机制
2. **GraphQL Schema 设计**: 如何设计高效的数据结构
3. **事件映射编程**: 将区块链事件转换为结构化数据
4. **部署和运维**: 完整的部署流程和故障排除
5. **调试技能**: 解决实际问题的能力

这些技能对于区块链开发非常重要，也是面试中的加分项！