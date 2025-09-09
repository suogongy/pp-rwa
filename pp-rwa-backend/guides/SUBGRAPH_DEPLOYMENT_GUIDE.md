# 🚀 Subgraph 部署步骤详解

## 🎯 概述

本指南提供详细的 subgraph 部署步骤，从准备到验证的完整流程，帮助您理解每个环节的原理。

## 📋 部署前准备

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
```

### 2. 项目结构验证

```bash
# 验证项目结构
cd pp-rwa-backend/subgraph

ls -la
# 应该包含：
# - schema.graphql
# - subgraph.yaml
# - src/rwa20-mapping.ts
# - abis/RWA20.json
```

### 3. 合约 ABI 准备

```bash
# 检查 ABI 文件
ls -la abis/

# 验证 ABI 格式
cat abis/RWA20.json | jq '.abi' | head -20

# 检查必需的事件
cat abis/RWA20.json | jq '.abi[] | select(.type == "event") | .name'
# 应该包含：Transfer, TokensMinted, TokensBurned, BatchTransferExecuted, WhitelistUpdated
```

## 🛠️ 部署流程详解

### 阶段 1: 本地测试部署（可选）

#### 步骤 1.1: 启动本地 Graph Node

```bash
# 启动 Graph Node
参考
```

#### 步骤 1.2: 配置本地 subgraph

```bash
# 复制本地配置文件
cp subgraph-local.yaml subgraph-local-deploy.yaml

# 编辑配置文件
nano subgraph-local-deploy.yaml
```

关键配置项：
```yaml
dataSources:
  - kind: ethereum
    name: RWA20
    network: mainnet  # 本地开发使用 mainnet
    source:
      address: "0xYourLocalContractAddress"  # 替换为实际地址
      abi: RWA20
      startBlock: 0
```

#### 步骤 1.3: 生成 AssemblyScript 代码

```bash
# 生成代码
graph codegen subgraph-local.yaml

# 验证生成的文件
ls -la generated/
# 应该包含 schema.ts 和 RWA20.ts

# 检查生成的事件类型
cat generated/RWA20.ts | grep "export class" | grep "Event"
```

#### 步骤 1.4: 构建 subgraph

```bash
# 构建 subgraph
graph build  subgraph-local.yaml

# 验证构建结果
ls -la build/
# 应该包含 RWA20.wasm 文件

# 检查构建日志
# 如果有错误，根据提示修复代码
```

#### 步骤 1.5: 创建本地 subgraph

```bash
# 创建 subgraph
graph create --node http://localhost:8020 pp-rwa-local

# 验证创建结果
curl http://localhost:8000/subgraphs/name/pp-rwa-local
```

#### 步骤 1.6: 部署到本地 Graph Node

```bash
# 部署
graph deploy --node http://localhost:8020 pp-rwa-local

# 监控部署日志
docker logs -f graph-node

# 验证部署
curl http://localhost:8000/subgraphs/name/pp-rwa-local
```

### 阶段 2: The Graph Hosted Service 部署

#### 步骤 2.1: 准备 The Graph Studio 账户

1. **访问 The Graph Studio**: https://thegraph.com/studio/
2. **连接钱包**: 使用 MetaMask 连接
3. **创建新项目**:
   - 点击 "Create" 按钮
   - 输入项目名称: `rwa20-subgraph`
   - 选择网络: `Sepolia`
   - 记录项目名称: `your-username/rwa20-subgraph`

#### 步骤 2.2: 获取访问令牌

```bash
# 在 The Graph Studio 项目页面
# 1. 进入项目详情
# 2. 点击 "Settings"
# 3. 找到 "Access Token"
# 4. 复制令牌

# 设置环境变量（临时）
export GRAPH_ACCESS_TOKEN=your_access_token_here
```

#### 步骤 2.3: 身份验证

```bash
# 身份验证
graph auth https://api.thegraph.com/deploy/ $GRAPH_ACCESS_TOKEN

# 验证认证
graph list
# 应该显示已认证的端点
```

#### 步骤 2.4: 配置生产环境 subgraph

```bash
# 复制生产配置文件
cp subgraph.yaml subgraph-production.yaml

# 编辑配置文件
nano subgraph-production.yaml
```

生产环境配置：
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

#### 步骤 2.5: 验证合约地址

```bash
# 验证 Sepolia 合约地址
cast code 0xYourSepoliaContractAddress --rpc-url https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# 检查合约事件
cast logs 0xYourSepoliaContractAddress --rpc-url https://sepolia.infura.io/v3/YOUR_INFURA_KEY --from-block latest --to-block latest
```

#### 步骤 2.6: 生成生产代码

```bash
# 生成代码
graph codegen --config subgraph-production.yaml

# 验证生成的代码
ls -la generated/
```

#### 步骤 2.7: 构建生产版本

```bash
# 构建
graph build --config subgraph-production.yaml

# 验证构建结果
ls -la build/
# 检查文件大小，应该比本地版本大
```

#### 步骤 2.8: 创建 Hosted Service subgraph

```bash
# 创建 subgraph（只需要一次）
graph create --node https://api.thegraph.com/deploy/ your-username/rwa20-subgraph

# 如果已存在，会提示错误，可以忽略
```

#### 步骤 2.9: 部署到 Hosted Service

```bash
# 部署
graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ your-username/rwa20-subgraph

# 记录部署信息
# 部署成功后会显示版本哈希和同步状态
```

## 🔍 部署验证

### 1. 检查同步状态

```bash
# 检查 subgraph 状态
curl -s https://api.thegraph.com/subgraphs/name/your-username/rwa20-subgraph | jq '.data.meta'

# 关键指标：
# - synced: true/false (是否同步完成)
# - signalled: true/false (是否已信号)
# - health: healthy (健康状态)
```

### 2. 测试 GraphQL 查询

```bash
# 测试基本查询
curl -X POST https://api.thegraph.com/subgraphs/name/your-username/rwa20-subgraph \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ tokens(first: 5) { id address name symbol } }"
  }'

# 测试转移查询
curl -X POST https://api.thegraph.com/subgraphs/name/your-username/rwa20-subgraph \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { transfers(first: 5, orderBy: timestamp, orderDirection: desc) { id from to amount timestamp } }"
  }'
```

### 3. 使用 GraphiQL 界面

1. **访问 Playground**: 
   ```
   https://thegraph.com/hosted-service/subgraph/your-username/rwa20-subgraph
   ```

2. **运行测试查询**:
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

### 4. 验证数据同步

```bash
# 生成一些测试交易
# 确保您的合约有交易活动

# 等待几分钟同步
# 然后检查是否有数据
curl -X POST https://api.thegraph.com/subgraphs/name/your-username/rwa20-subgraph \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ transfers { id } }"
  }' | jq '.data.transfers | length'
```

## 🛠️ 故障排除

### 常见部署问题

#### 1. 认证失败

```bash
# 错误信息：Authentication required
# 解决方案：
graph auth https://api.thegraph.com/deploy/ your_new_token

# 清除认证缓存
rm ~/.graphprotocol/auth.yml
graph auth https://api.thegraph.com/deploy/ your_token
```

#### 2. 合约地址错误

```bash
# 错误信息：Contract not found
# 解决方案：
# 验证合约地址
cast code 0xYourContractAddress --rpc-url https://sepolia.infura.io/v3/YOUR_KEY

# 如果返回 0x，说明地址错误
# 重新部署合约或更新配置
```

#### 3. 事件监听问题

```bash
# 错误信息：No events found
# 解决方案：
# 检查合约是否有事件
cast logs 0xYourContractAddress --rpc-url https://sepolia.infura.io/v3/YOUR_KEY --from-block 0

# 确保事件名称匹配
# 检查 subgraph.yaml 中的 eventHandlers 配置
```

#### 4. 同步缓慢

```bash
# 问题：subgraph 长时间显示 syncing
# 解决方案：
# 1. 检查合约交易量
# 2. 考虑设置 startBlock 为最近的区块
# 3. 耐心等待，首次同步可能需要时间
```

### 调试技巧

#### 1. 详细日志

```bash
# 构建时启用详细日志
graph build --config subgraph-production.yaml --verbose

# 部署时启用详细日志
graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ your-username/rwa20-subgraph --verbose
```

#### 2. 本地测试

```bash
# 在本地测试 subgraph 映射
graph test --config subgraph-production.yaml

# 运行单元测试
graph test --match-files src/**/*.test.ts
```

#### 3. 数据验证

```bash
# 检查生成的 WASM 文件
ls -la build/RWA20.wasm

# 检查生成的 schema
cat build/schema.graphql
```

## 📚 部署后维护

### 1. 版本管理

```bash
# 标记重要版本
git tag -a v1.0.0 -m "Initial Sepolia deployment"

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
graph codegen --config subgraph-production.yaml
graph build --config subgraph-production.yaml
graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ your-username/rwa20-subgraph
```

## 🎯 学习要点

通过手动部署过程，您将学习到：

1. **The Graph 架构**: 理解去中心化索引的工作原理
2. **GraphQL 开发**: Schema 设计和查询优化
3. **AssemblyScript**: 智能合约事件处理编程
4. **部署流程**: 从开发到生产的完整流程
5. **故障排除**: 实际问题的诊断和解决
6. **监控维护**: 生产环境的运维技能

这些技能对于区块链开发工程师来说非常宝贵！