# 🔧 Subgraph 开发和维护指南

## 🎯 概述

本指南提供 Subgraph 开发、测试、部署和维护的详细说明，帮助开发者理解和维护 RWA20 Subgraph 项目。

## 📋 项目结构

```
pp-rwa-backend/subgraph/
├── schema.graphql              # GraphQL schema 定义
├── subgraph-local.yaml        # 本地开发配置
├── subgraph-production.yaml   # 生产环境配置
├── package.json              # 依赖和脚本
├── src/
│   └── rwa20-mapping.ts      # 事件映射逻辑
├── abis/
│   └── RWA20.json            # 合约 ABI 文件
├── generated/                # 自动生成的代码
└── build/                    # 构建输出
```

## 🛠️ 开发环境设置

### 1. 依赖安装

```bash
# 进入 subgraph 目录
cd pp-rwa-backend/subgraph

# 安装依赖
npm install

# 验证安装
npm list
```

### 2. 代码生成

```bash
# 生成本地开发代码
npm run codegen

# 生成生产环境代码
graph codegen --config subgraph-production.yaml

# 验证生成的文件
ls -la generated/
```

### 3. 构建项目

```bash
# 构建本地版本
npm run build

# 构建生产版本
graph build --config subgraph-production.yaml

# 验证构建结果
ls -la build/
```

## 📝 Schema 设计

### 实体关系

```graphql
# 核心实体
type Token @entity(immutable: true) {
  id: ID!
  address: Bytes!
  name: String!
  symbol: String!
  decimals: Int!
  totalSupply: BigInt!
  owner: Bytes!
  isPaused: Boolean!
  version: String!
  createdAt: BigInt!
  updatedAt: BigInt!
}

# 事件实体
type Transfer @entity(immutable: true) {
  id: ID!
  token: Token!
  from: Bytes!
  to: Bytes!
  amount: BigInt!
  blockNumber: BigInt!
  timestamp: BigInt!
  transactionHash: Bytes!
}

type Mint @entity(immutable: true) {
  id: ID!
  token: Token!
  to: Bytes!
  amount: BigInt!
  documentHash: Bytes!
  blockNumber: BigInt!
  timestamp: BigInt!
  transactionHash: Bytes!
}

type Burn @entity(immutable: true) {
  id: ID!
  token: Token!
  from: Bytes!
  amount: BigInt!
  documentHash: Bytes!
  blockNumber: BigInt!
  timestamp: BigInt!
  transactionHash: Bytes!
}

# 账户实体（可变）
type Account @entity {
  id: ID!
  address: Bytes!
  transfersFrom: [Transfer!]!
  transfersTo: [Transfer!]!
  mintsReceived: [Mint!]!
  burnsFrom: [Burn!]!
  batchTransfersFrom: [BatchTransfer!]!
  whitelistUpdates: [WhitelistUpdate!]!
  createdAt: BigInt!
  updatedAt: BigInt!
}
```

### Schema 设计原则

1. **不可变实体**: 事件相关实体使用 `@entity(immutable: true)`
2. **可变实体**: 账户信息使用 `@entity` 允许更新
3. **关系管理**: 手动管理实体关系，不使用 `@derivedFrom`
4. **数据完整性**: 确保所有必需字段都有默认值

## 🔧 映射逻辑开发

### 核心函数

```typescript
// 获取或创建 Token 实体
export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString())
  if (token == null) {
    token = new Token(address.toHexString())
    token.address = address
    
    // 绑定合约获取信息
    let contract = RWA20.bind(address)
    
    // 获取代币信息
    let nameResult = contract.try_name()
    let symbolResult = contract.try_symbol()
    let decimalsResult = contract.try_decimals()
    let totalSupplyResult = contract.try_totalSupply()
    let ownerResult = contract.try_owner()
    let versionResult = contract.try_version()
    
    // 设置字段值
    token.name = nameResult.reverted ? "Unknown Token" : nameResult.value
    token.symbol = symbolResult.reverted ? "UNKNOWN" : symbolResult.value
    token.decimals = decimalsResult.reverted ? 18 : decimalsResult.value
    token.totalSupply = totalSupplyResult.reverted ? BigInt.zero() : totalSupplyResult.value
    token.owner = ownerResult.reverted ? address : ownerResult.value
    token.isPaused = false
    token.version = versionResult.reverted ? "1.0.0" : versionResult.value
    
    token.createdAt = BigInt.zero()
    token.updatedAt = BigInt.zero()
    token.save()
  }
  return token
}

// 获取或创建账户实体
export function getOrCreateAccount(address: Address): Account {
  let account = Account.load(address.toHexString())
  if (account == null) {
    account = new Account(address.toHexString())
    account.address = address
    account.transfersFrom = []
    account.transfersTo = []
    account.mintsReceived = []
    account.burnsFrom = []
    account.batchTransfersFrom = []
    account.whitelistUpdates = []
    account.createdAt = BigInt.zero()
    account.updatedAt = BigInt.zero()
    account.save()
  }
  return account
}
```

### 事件处理器

```typescript
// Transfer 事件处理
export function handleTransfer(event: TransferEvent): void {
  let token = getOrCreateToken(event.address)
  let fromAccount = getOrCreateAccount(event.params.from)
  let toAccount = getOrCreateAccount(event.params.to)
  
  // 创建 Transfer 实体
  let transfer = new Transfer(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  transfer.token = token.id
  transfer.from = event.params.from
  transfer.to = event.params.to
  transfer.amount = event.params.value
  transfer.blockNumber = event.block.number
  transfer.timestamp = event.block.timestamp
  transfer.transactionHash = event.transaction.hash
  transfer.save()
  
  // 更新账户关系
  fromAccount.transfersFrom = [transfer]
  fromAccount.updatedAt = event.block.timestamp
  fromAccount.save()
  
  toAccount.transfersTo = [transfer]
  toAccount.updatedAt = event.block.timestamp
  toAccount.save()
}

// TokensMinted 事件处理
export function handleTokensMinted(event: TokensMintedEvent): void {
  let token = getOrCreateToken(event.address)
  let toAccount = getOrCreateAccount(event.params.to)
  
  // 创建 Mint 实体
  let mint = new Mint(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  mint.token = token.id
  mint.to = event.params.to
  mint.amount = event.params.amount
  mint.documentHash = event.params.documentHash
  mint.blockNumber = event.block.number
  mint.timestamp = event.block.timestamp
  mint.transactionHash = event.transaction.hash
  mint.save()
  
  // 更新账户关系
  toAccount.mintsReceived = [mint]
  toAccount.updatedAt = event.block.timestamp
  toAccount.save()
  
  // 更新代币总供应量
  token.totalSupply = token.totalSupply.plus(event.params.amount)
  token.updatedAt = event.block.timestamp
  token.save()
}
```

## 🧪 测试和调试

### 1. 本地测试

```bash
# 启动本地 Graph Node
cd ../graph-node
docker-compose -f docker/docker-compose.yml up -d

# 生成和构建
cd ../subgraph
npm run codegen
npm run build

# 创建和部署
npm run create-local
npm run deploy-local
```

### 2. 测试查询

```bash
# 测试基本查询
curl -X POST http://localhost:8000/subgraphs/name/pp-rwa-local \
  -H "Content-Type: application/json" \
  -d '{"query": "{ tokens { id name symbol totalSupply } }"}'

# 测试复杂查询
curl -X POST http://localhost:8000/subgraphs/name/pp-rwa-local \
  -H "Content-Type: application/json" \
  -d '{"query": "query { transfers(first: 5, orderBy: timestamp, orderDirection: desc) { id from to amount timestamp token { name symbol } } }"}'
```

### 3. 使用 GraphiQL

访问本地 GraphiQL 界面：http://localhost:8000/subgraphs/name/pp-rwa-local/graphql

示例查询：

```graphql
# 查询代币信息
query {
  tokens {
    id
    address
    name
    symbol
    decimals
    totalSupply
    owner
    isPaused
    version
  }
}

# 查询最近的转账
query {
  transfers(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    from
    to
    amount
    blockNumber
    timestamp
    transactionHash
    token {
      name
      symbol
    }
  }
}

# 查询特定代币的转账
query {
  transfers(where: { token: "0xYourContractAddress" }, first: 5) {
    id
    from
    to
    amount
    timestamp
  }
}
```

## 🚀 部署流程

### 本地部署

```bash
# 1. 生成代码
npm run codegen

# 2. 构建
npm run build

# 3. 创建 subgraph
npm run create-local

# 4. 部署
npm run deploy-local

# 5. 验证
curl http://localhost:8000/subgraphs/name/pp-rwa-local
```

### 生产环境部署

```bash
# 1. 配置生产环境
cp subgraph-local.yaml subgraph-production.yaml
# 编辑 subgraph-production.yaml

# 2. 身份验证
graph auth https://api.thegraph.com/deploy/ YOUR_ACCESS_TOKEN

# 3. 生成和构建
graph codegen --config subgraph-production.yaml
graph build --config subgraph-production.yaml

# 4. 创建 subgraph
graph create --node https://api.thegraph.com/deploy/ your-username/your-project-name

# 5. 部署
graph deploy --node https://api.thegraph.com/deploy/ your-username/your-project-name
```

## 🔍 监控和维护

### 1. 同步状态监控

```bash
# 检查本地同步状态
curl -s http://localhost:8000/subgraphs/name/pp-rwa-local | jq '.data.meta'

# 检查生产环境同步状态
curl -s https://api.thegraph.com/subgraphs/name/your-username/your-project-name | jq '.data.meta'
```

### 2. 性能监控

```bash
# 监控 Graph Node 性能
docker logs rwa-graph-node

# 监控 PostgreSQL 性能
docker exec rwa-postgres psql -U graph-node -c "SELECT * FROM subgraphs;"

# 监控 IPFS 性能
docker logs rwa-ipfs
```

### 3. 日志分析

```bash
# 查看所有服务日志
cd ../graph-node
docker-compose -f docker/docker-compose.yml logs

# 实时查看日志
docker-compose -f docker/docker-compose.yml logs -f

# 查看特定服务日志
docker-compose -f docker/docker-compose.yml logs graph-node
```

## 🛠️ 常见问题和解决方案

### 1. 构建失败

```bash
# 错误：TypeScript 编译错误
# 解决：检查映射文件语法
graph build --verbose

# 错误：ABI 文件不存在
# 解决：确保 ABI 文件路径正确
ls abis/RWA20.json

# 错误：Schema 验证失败
# 解决：检查 GraphQL schema 语法
npm run build
```

### 2. 部署失败

```bash
# 错误：认证失败
graph auth https://api.thegraph.com/deploy/ your_new_token

# 错误：网络连接问题
# 检查网络连接和代理设置

# 错误：合约地址错误
# 验证合约地址
cast code 0xYourContractAddress --rpc-url your-rpc-url
```

### 3. 同步问题

```bash
# 问题：subgraph 长时间显示 syncing
# 解决：
# 1. 检查合约交易量
# 2. 考虑设置 startBlock 为最近的区块
# 3. 耐心等待，首次同步可能需要时间

# 问题：数据不完整
# 解决：
# 1. 检查事件监听配置
# 2. 验证合约事件定义
# 3. 重新部署 subgraph
```

### 4. 数据一致性问题

```bash
# 问题：实体关系不正确
# 解决：
# 1. 检查映射函数中的关系更新逻辑
# 2. 确保 Account 实体正确创建和更新
# 3. 验证事件处理器中的字段赋值
```

## 📚 最佳实践

### 1. 代码组织

```typescript
// 将常用函数提取到单独文件
// src/utils.ts
export function getOrCreateToken(address: Address): Token { ... }
export function getOrCreateAccount(address: Address): Account { ... }
export function updateTokenTimestamp(token: Token, timestamp: BigInt): void { ... }

// 在映射文件中导入
import { getOrCreateToken, getOrCreateAccount } from './utils'
```

### 2. 错误处理

```typescript
// 使用 try-catch 处理合约调用
export function handleTransfer(event: TransferEvent): void {
  try {
    let token = getOrCreateToken(event.address)
    // 处理逻辑
  } catch (error) {
    // 记录错误
    log.error("Error handling transfer: {}", [error.toString()])
  }
}
```

### 3. 性能优化

```typescript
// 批量更新实体
export function batchUpdateAccounts(accounts: Account[], timestamp: BigInt): void {
  for (let i = 0; i < accounts.length; i++) {
    accounts[i].updatedAt = timestamp
    accounts[i].save()
  }
}

// 避免重复查询
let token = getOrCreateToken(event.address)
// 重用 token 对象，而不是重复查询
```

### 4. 版本管理

```bash
# 标记重要版本
git tag -a v1.0.0 -m "Initial subgraph release"

# 推送标签
git push origin v1.0.0

# 创建版本分支
git checkout -b feature/new-event-handlers
```

## 🔄 更新和升级

### 1. 添加新事件处理器

```yaml
# 在 subgraph.yaml 中添加新事件
eventHandlers:
  - event: NewEvent(indexed address,uint256)
    handler: handleNewEvent
```

```typescript
// 在映射文件中实现处理器
export function handleNewEvent(event: NewEventEvent): void {
  // 处理逻辑
}
```

### 2. Schema 更新

```graphql
# 添加新字段
type Token @entity(immutable: true) {
  id: ID!
  # ... 现有字段
  newField: String!  # 新增字段
}
```

### 3. 重新部署

```bash
# 更新后重新部署
npm run codegen
npm run build
npm run deploy-local
```

## 🎯 学习要点

通过 Subgraph 开发和维护，您将学习到：

1. **GraphQL Schema 设计**: 如何设计高效的数据结构
2. **事件映射编程**: 将区块链事件转换为结构化数据
3. **实体关系管理**: 理解实体间的关系和依赖
4. **性能优化**: 提高查询效率和数据处理速度
5. **调试技能**: 解决实际开发中的问题
6. **版本管理**: 维护和更新 subgraph 的最佳实践
7. **监控维护**: 生产环境的运维技能

这些技能对于区块链数据索引和 DApp 开发非常重要！