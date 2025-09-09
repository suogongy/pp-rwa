# 📚 The Graph 配置和部署指南

## 🎯 概述

本指南详细介绍如何手动配置和部署 The Graph subgraph，帮助您理解每个步骤的原理和操作。

## 📝 重要提示

**推荐使用 Docker Compose**: 本项目已配置完整的 Docker Compose 环境，包含 Graph Node、IPFS 和 PostgreSQL 服务。相比手动部署，Docker Compose 提供了：

- **一键启动**: 所有服务同时启动，自动处理依赖关系
- **数据持久化**: 数据存储在本地卷中，重启后数据不丢失
- **简化管理**: 统一的启动、停止、日志查看命令
- **环境一致性**: 确保开发和生产环境的一致性

本地开发请使用 Docker Compose 方式，详见下面的本地部署部分。

## ⚠️ 重要注意事项

### 1. PostgreSQL Locale 配置问题
Graph Node 需要数据库使用 `C` locale，而不是默认的 `en_US.utf8`。如果遇到 locale 错误，请确保：

- 使用 `POSTGRES_INITDB_ARGS: "--locale=C --encoding=UTF8"` 环境变量
- 不要自动创建数据库（移除 `POSTGRES_DB` 环境变量）
- 手动创建数据库：`createdb -U graph-node -T template0 -l C -E UTF8 graph-node`

### 2. Graph Node 版本兼容性
新版本的 Graph Node 要求：
- 所有实体必须使用 `@entity(immutable: true)` 指令
- 不能使用 `@derivedFrom` 指令
- 事件签名必须与 ABI 完全匹配，包括 `indexed` 参数

### 3. 部署配置
- 本地开发使用 `mainnet` 网络（连接到本地 Anvil）
- 确保合约地址正确配置
- 使用正确的 IPFS 端点（默认 `http://localhost:5001`）

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

## 🛠️ 环境准备

### 1. 安装必要工具

```bash
# 安装 Graph CLI
npm install -g @graphprotocol/graph-cli

# 验证安装
graph --version

# 确保 Docker 和 Docker Compose 已安装
docker --version
docker-compose --version
```

### 2. 配置文件说明

项目已包含以下配置文件：
- `subgraph-local.yaml`: 本地开发配置
- `schema.graphql`: GraphQL schema 定义
- `src/rwa20-mapping.ts`: 事件映射逻辑
- `abis/RWA20.json`: 合约 ABI 文件

主要配置说明：
- 本地开发使用 `mainnet` 网络连接本地 Anvil
- 合约地址：`0x5FbDB2315678afecb367f032d93F642f64180aa3`
- 事件处理器：Transfer, TokensMinted, TokensBurned, BatchTransferExecuted, WhitelistUpdate

### 3. 验证智能合约部署

确保您的 RWA20 智能合约已部署到本地 Anvil 网络：

```bash
# 检查合约是否已部署
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "name()" --rpc-url http://localhost:8545
```

如果合约未部署，请使用 Foundry 部署：

```bash
# 部署合约
forge script script/Counter.s.sol:CounterScript --broadcast --rpc-url http://localhost:8545
```

## 🚀 完整部署流程详解

### 本地部署（推荐）

#### 步骤 1：启动 Graph Node 服务

```bash
# 进入 graph-node 目录
cd pp-rwa-backend/graph-node

# 启动所有服务（Graph Node + IPFS + PostgreSQL）
docker-compose -f docker/docker-compose.yml up -d

# 查看服务状态
docker-compose -f docker/docker-compose.yml ps

# 查看日志（检查是否有错误）
docker-compose -f docker/docker-compose.yml logs -f
```

#### 步骤 2：手动创建数据库（如果需要）

如果 PostgreSQL 启动后出现 locale 错误，需要手动创建数据库：

```bash
# 进入 PostgreSQL 容器
docker exec -it rwa-postgres bash

# 在容器内执行
createdb -U graph-node -T template0 -l C -E UTF8 graph-node

# 退出容器
exit
```

#### 步骤 3：验证服务启动

```bash
# 验证 Graph Node 启动
curl http://localhost:8000/

# 应该返回：{"message": "Access deployed subgraphs by deployment ID at /subgraphs/id/<ID> or by name at /subgraphs/name/<NAME>"}

# 验证 IPFS 启动
curl http://localhost:5001/

# 验证 PostgreSQL 启动
docker exec rwa-postgres psql -U graph-node -c "\l"
```

#### 步骤 4：准备 Subgraph 项目

```bash
# 进入 subgraph 目录
cd pp-rwa-backend/subgraph

# 初始化 npm 项目（如果还没有）
npm init -y

# 安装必要依赖
npm install @graphprotocol/graph-ts
```

#### 步骤 5：生成 AssemblyScript 代码

```bash
# 使用本地配置生成代码
graph codegen subgraph-local.yaml
```

#### 步骤 6：构建 Subgraph

```bash
# 构建 subgraph
graph build subgraph-local.yaml
```

#### 步骤 7：创建 Subgraph

```bash
# 在 Graph Node 中创建 subgraph
graph create --node http://localhost:8020 pp-rwa
```

#### 步骤 8：部署 Subgraph

```bash
# 部署 subgraph（会提示输入版本标签）
graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 pp-rwa

# 或者直接指定版本标签
graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 pp-rwa subgraph-local.yaml --version-label v0.0.1
```

#### 步骤 9：验证部署

```bash
# 测试 GraphQL 端点
curl http://localhost:8000/subgraphs/name/pp-rwa

# 使用 GraphQL 查询测试
curl -X POST http://localhost:8000/subgraphs/name/pp-rwa \
  -H "Content-Type: application/json" \
  -d '{"query": "{ tokens { id address name symbol } }"}'
```

### 停止服务

```bash
# 停止所有服务
docker-compose -f docker/docker-compose.yml down

# 停止并删除数据（谨慎使用）
docker-compose -f docker/docker-compose.yml down -v
```

## 🌐 The Graph Hosted Service 部署

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

#### 1. PostgreSQL Locale 错误

**错误信息**：
```
Database does not use C locale. Please check the graph-node documentation for how to set up the database locale: database collation is `en_US.utf8` but must be `C`
```

**解决方案**：
1. 确保 docker-compose.yml 中 PostgreSQL 配置正确：
   ```yaml
   environment:
     LC_ALL: C
     LANG: C
     POSTGRES_INITDB_ARGS: "--locale=C --encoding=UTF8"
   ```
2. 移除 `POSTGRES_DB` 环境变量
3. 手动创建数据库：
   ```bash
   docker exec -it rwa-postgres bash
   createdb -U graph-node -T template0 -l C -E UTF8 graph-node
   exit
   ```

#### 2. Graph Node 版本兼容性问题

**错误信息**：
```
"@entity directive requires `immutable` argument"
```

**解决方案**：
1. 更新 schema.graphql 中所有实体定义：
   ```graphql
   # 旧版本
   type Token @entity {
   
   # 新版本
   type Token @entity(immutable: true) {
   ```
2. 移除所有 `@derivedFrom` 指令
3. 更新映射文件，移除对只读字段的直接赋值

#### 3. 事件签名不匹配

**错误信息**：
```
Event with signature 'TokensMinted(indexed address,uint256,bytes32)' not present in ABI
```

**解决方案**：
1. 检查 ABI 文件中的实际事件签名
2. 确保 subgraph.yaml 中的事件签名与 ABI 完全匹配
3. 注意 `indexed` 参数的位置和数量

#### 4. 网络配置问题

**错误信息**：
```
network not supported by registrar: no network anvil found on chain ethereum
```

**解决方案**：
1. 本地开发使用 `mainnet` 网络
2. 确保 docker-compose.yml 中的网络配置正确：
   ```yaml
   environment:
     ethereum: 'mainnet:http://host.docker.internal:8545'
   ```

#### 5. 代码生成失败

```bash
# 错误：Cannot find module 'assemblyscript'
# 解决：安装 AssemblyScript
npm install -g assemblyscript

# 错误：ABI 文件不存在
# 解决：确保 ABI 文件路径正确
ls abis/RWA20.json
```

#### 6. 构建失败

```bash
# 错误：TypeScript 编译错误
# 解决：检查映射文件语法
graph build --verbose

# 错误：YAML 格式错误
# 解决：验证 YAML 语法
npm install -g yaml-lint
yaml-lint subgraph.yaml
```

#### 7. 同步问题

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
# 使用 Docker Compose 查看所有服务日志
docker-compose -f docker/docker-compose.yml logs

# 实时查看日志
docker-compose -f docker/docker-compose.yml logs -f

# 查看特定服务日志
docker-compose -f docker/docker-compose.yml logs graph-node
docker-compose -f docker/docker-compose.yml logs ipfs
docker-compose -f docker/docker-compose.yml logs postgres

# 使用原生 Docker 命令查看日志
docker logs rwa-graph-node
docker logs -f rwa-graph-node
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
6. **Docker 容器化部署**: 使用 Docker Compose 管理多服务应用
7. **数据库配置**: 理解 PostgreSQL locale 配置的重要性
8. **版本兼容性**: 处理不同版本软件的兼容性问题

这些技能对于区块链开发非常重要，也是面试中的加分项！

## 📋 快速检查清单

### 部署前检查
- [ ] Docker 和 Docker Compose 已安装
- [ ] Graph CLI 已安装 (`npm install -g @graphprotocol/graph-cli`)
- [ ] 智能合约已部署到本地网络
- [ ] 合约地址已正确配置在 subgraph-local.yaml 中
- [ ] ABI 文件已更新到 abis/ 目录

### 部署步骤检查
- [ ] 启动 Docker Compose 服务
- [ ] 验证所有服务正常运行
- [ ] 手动创建数据库（如需要）
- [ ] 生成 AssemblyScript 代码
- [ ] 构建 subgraph
- [ ] 创建 subgraph
- [ ] 部署 subgraph
- [ ] 验证部署成功

### 故障排除检查
- [ ] 检查 PostgreSQL locale 配置
- [ ] 验证 Graph Node 版本兼容性
- [ ] 确认事件签名匹配
- [ ] 检查网络配置
- [ ] 查看服务日志