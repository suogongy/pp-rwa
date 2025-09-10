# 🚀 完整部署指南

## 📋 概述

本指南提供从零开始部署 RWA20 Subgraph 的完整流程，涵盖环境准备、配置、部署和验证全过程。

## 🛠️ 环境准备

### 1. 系统要求检查

```bash
# 检查 Node.js 版本
node --version
# 需要 >= 16.0

# 检查 npm 版本
npm --version
# 需要 >= 8.0

# 检查 Graph CLI
graph --version
# 如果未安装：npm install -g @graphprotocol/graph-cli

# 检查 Docker 和 Docker Compose
docker --version
docker-compose --version
```

### 2. 项目结构验证

```bash
# 验证项目结构
cd pp-rwa-backend/subgraph

ls -la
# 应该包含：
# - schema.graphql
# - subgraph-local.yaml
# - src/rwa20-mapping.ts
# - abis/RWA20.json
# - package.json
```

### 3. 智能合约部署验证

#### 本地合约验证

```bash
# 检查本地合约是否已部署
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "name()" --rpc-url http://localhost:8545

# 如果合约未部署，使用 Foundry 部署：
cd ../pp-rwa-contract
forge script script/DeployRWA20.s.sol:DeployToLocal --rpc-url http://localhost:8545 --broadcast
```

#### Sepolia 合约验证

```bash
# 检查 Sepolia 合约地址
cast code 0xYourSepoliaContractAddress --rpc-url https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# 部署合约到 Sepolia
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
forge script script/DeployRWA20.s.sol:DeployToSepolia --rpc-url $SEPOLIA_RPC_URL --broadcast
```

## 🚀 本地部署（推荐用于开发）

### 步骤 1：启动 Graph Node 服务

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

### 步骤 2：手动创建数据库（如果需要）

如果 PostgreSQL 启动后出现 locale 错误：

```bash
# 进入 PostgreSQL 容器
docker exec -it rwa-postgres bash

# 在容器内执行
createdb -U graph-node -T template0 -l C -E UTF8 graph-node

# 退出容器
exit
```

### 步骤 3：验证服务启动

```bash
# 验证 Graph Node 启动
curl http://localhost:8000/

# 应该返回：{"message": "Access deployed subgraphs by deployment ID at /subgraphs/id/<ID> or by name at /subgraphs/name/<NAME>"}

# 验证 IPFS 启动
curl http://localhost:5001/

# 验证 PostgreSQL 启动
docker exec rwa-postgres psql -U graph-node -c "\l"
```

### 步骤 4：生成和构建 Subgraph

```bash
# 进入 subgraph 目录
cd pp-rwa-backend/subgraph

# 安装依赖（如果还没有）
npm install

# 生成 AssemblyScript 代码
npm run codegen

# 验证生成的文件
ls -la generated/
# 应该包含 schema.ts 和 RWA20.ts
```

### 步骤 5：构建 Subgraph

```bash
# 构建 subgraph
npm run build

# 验证构建结果
ls -la build/
# 应该包含 RWA20.wasm 文件
```

### 步骤 6：创建和部署 Subgraph

```bash
# 创建 subgraph（只需要一次）
npm run create-local

# 部署 subgraph
npm run deploy-local

# 或者部署开发版本
npm run deploy-local:dev
```

### 步骤 7：验证部署

```bash
# 测试 GraphQL 端点
curl http://localhost:8000/subgraphs/name/pp-rwa-local

# 使用 GraphQL 查询测试
curl -X POST http://localhost:8000/subgraphs/name/pp-rwa-local \
  -H "Content-Type: application/json" \
  -d '{"query": "{ tokens { id address name symbol } }"}'
```

## 🌐 The Graph Hosted Service 部署

### 步骤 1：准备 The Graph Studio 账户

1. **访问 The Graph Studio**: https://thegraph.com/studio/
2. **连接钱包**: 使用 MetaMask 连接
3. **创建新项目**:
   - 点击 "Create" 按钮
   - 输入项目名称: `rwa20-subgraph`
   - 选择网络: `Sepolia`
   - 记录项目名称: `your-username/rwa20-subgraph`

### 步骤 2：身份验证

```bash
# 获取访问令牌
# 在 The Graph Studio 项目页面找到 "Access Token"

# 身份验证
graph auth https://api.thegraph.com/deploy/ YOUR_ACCESS_TOKEN

# 验证认证
graph list
# 应该显示已认证的端点
```

### 步骤 3：配置生产环境

```bash
# 复制配置文件
cp subgraph-local.yaml subgraph-production.yaml

# 编辑生产配置
nano subgraph-production.yaml
```

生产环境关键配置：
```yaml
dataSources:
  - kind: ethereum
    name: RWA20
    network: sepolia  # 重要：设置为 sepolia
    source:
      address: "0xYourSepoliaContractAddress"  # 替换为 Sepolia 合约地址
      abi: RWA20
      startBlock: 0  # 可以设置为部署区块号以提高同步速度
```

### 步骤 4：生成和构建生产版本

```bash
# 使用生产配置生成代码
graph codegen --config subgraph-production.yaml

# 构建生产版本
graph build --config subgraph-production.yaml
```

### 步骤 5：创建和部署 Hosted Service

```bash
# 创建 subgraph（只需要一次）
graph create --node https://api.thegraph.com/deploy/ your-username/rwa20-subgraph

# 部署到 Hosted Service
graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ your-username/rwa20-subgraph
```

## 🔍 部署验证

### 本地部署验证

```bash
# 测试基本查询
curl -X POST http://localhost:8000/subgraphs/name/pp-rwa-local \
  -H "Content-Type: application/json" \
  -d '{"query": "{ tokens(first: 5) { id address name symbol } }"}'

# 测试转移查询
curl -X POST http://localhost:8000/subgraphs/name/pp-rwa-local \
  -H "Content-Type: application/json" \
  -d '{"query": "query { transfers(first: 5, orderBy: timestamp, orderDirection: desc) { id from to amount timestamp } }"}'
```

### Hosted Service 验证

```bash
# 检查 subgraph 状态
curl -s https://api.thegraph.com/subgraphs/name/your-username/rwa20-subgraph | jq '.data.meta'

# 关键指标：
# - synced: true/false (是否同步完成)
# - signalled: true/false (是否已信号)
# - health: healthy (健康状态)

# 测试查询
curl -X POST https://api.thegraph.com/subgraphs/name/your-username/rwa20-subgraph \
  -H "Content-Type: application/json" \
  -d '{"query": "{ tokens { id address name symbol } }"}'
```

### 使用 GraphiQL 界面

1. **本地 Playground**: http://localhost:8000/subgraphs/name/pp-rwa-local/graphql
2. **Hosted Service Playground**: https://thegraph.com/hosted-service/subgraph/your-username/rwa20-subgraph

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
```

## 🛠️ 故障排除

### 常见部署问题

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

#### 5. 认证失败

```bash
# 错误信息：Authentication required
# 解决方案：
graph auth https://api.thegraph.com/deploy/ your_new_token

# 清除认证缓存
rm ~/.graphprotocol/auth.yml
graph auth https://api.thegraph.com/deploy/ your_token
```

#### 6. 合约地址错误

```bash
# 错误信息：Contract not found
# 解决方案：
# 验证合约地址
cast code 0xYourContractAddress --rpc-url your-rpc-url

# 如果返回 0x，说明地址错误
# 重新部署合约或更新配置
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
```

#### 2. 本地测试

```bash
# 在本地测试 subgraph
graph deploy --node http://localhost:8020 --debug pp-rwa-local

# 运行详细构建
graph build --config subgraph-local.yaml --verbose

# 部署时启用详细日志
graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 pp-rwa-local --verbose
```

#### 3. 验证事件监听

```bash
# 检查合约事件
cast logs 0xYourContractAddress --rpc-url your-rpc-url --from-block 0

# 确保事件名称匹配
# 检查 subgraph.yaml 中的 eventHandlers 配置
```

## 📚 维护和监控

### 1. 版本管理

```bash
# 标记重要版本
git tag -a v1.0.0 -m "Initial deployment"

# 推送标签
git push origin v1.0.0
```

### 2. 监控设置

```bash
# 创建监控脚本
cat > monitor-subgraph.sh << 'EOF'
#!/bin/bash

SUBGRAPH_URL="https://api.thegraph.com/subgraphs/name/your-username/rwa20-subgraph"

while true; do
  STATUS=$(curl -s "$SUBGRAPH_URL" | jq -r '.data.meta.synced')
  if [ "$STATUS" != "true" ]; then
    echo "⚠️  Subgraph not synced at $(date)"
    # 可以添加邮件通知或其他告警
  fi
  sleep 300  # 每5分钟检查一次
done
EOF

chmod +x monitor-subgraph.sh
```

### 3. 更新部署

```bash
# 更新 subgraph 后重新部署
npm run codegen
npm run build
npm run deploy-local
```

## 📋 快速检查清单

### 部署前检查
- [ ] Docker 和 Docker Compose 已安装
- [ ] Graph CLI 已安装 (`npm install -g @graphprotocol/graph-cli`)
- [ ] 智能合约已部署到目标网络
- [ ] 合约地址已正确配置在 subgraph-local.yaml 中
- [ ] ABI 文件已更新到 abis/ 目录

### 本地部署步骤检查
- [ ] 启动 Docker Compose 服务
- [ ] 验证所有服务正常运行
- [ ] 手动创建数据库（如需要）
- [ ] 生成 AssemblyScript 代码
- [ ] 构建 subgraph
- [ ] 创建 subgraph
- [ ] 部署 subgraph
- [ ] 验证部署成功

### Hosted Service 部署检查
- [ ] 创建 The Graph Studio 项目
- [ ] 完成身份验证
- [ ] 配置生产环境文件
- [ ] 生成和构建生产版本
- [ ] 部署到 Hosted Service
- [ ] 验证同步状态

### 故障排除检查
- [ ] 检查 PostgreSQL locale 配置
- [ ] 验证 Graph Node 版本兼容性
- [ ] 确认事件签名匹配
- [ ] 检查网络配置
- [ ] 查看服务日志
- [ ] 验证合约地址正确性

## 🎯 学习要点

通过完整的部署流程，您将学习到：

1. **The Graph 协议原理**: 理解去中心化数据索引的工作机制
2. **GraphQL Schema 设计**: 如何设计高效的数据结构
3. **事件映射编程**: 将区块链事件转换为结构化数据
4. **部署和运维**: 完整的部署流程和故障排除
5. **调试技能**: 解决实际问题的能力
6. **Docker 容器化部署**: 使用 Docker Compose 管理多服务应用
7. **数据库配置**: 理解 PostgreSQL locale 配置的重要性
8. **版本兼容性**: 处理不同版本软件的兼容性问题

这些技能对于区块链开发非常重要，也是面试中的加分项！