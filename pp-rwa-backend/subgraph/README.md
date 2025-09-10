# PP-RWA Subgraph 部署指南

## 概述
本subgraph用于索引和跟踪PP-RWA代币合约的所有事件，包括转账、铸造、销毁、批量转账和白名单更新等。

## 文件结构
```
subgraph/
├── schema.graphql          # GraphQL schema定义
├── src/
│   └── rwa20-mapping.ts    # 事件处理映射逻辑
├── abis/
│   └── RWA20.json          # 合约ABI
├── subgraph-local.yaml    # 本地部署配置
├── package.json           # 项目配置和脚本
└── build/                 # 构建输出目录
```

## 主要功能
- 完整的代币信息跟踪（名称、符号、小数位、总供应量等）
- 所有转账事件的索引和查询
- 代币铸造和销毁事件跟踪
- 批量转账事件处理
- 白名单状态变更记录
- 合约暂停/恢复状态跟踪

## 实体定义

### Token
- 基本信息：名称、符号、小数位、总供应量
- 状态信息：所有者、暂停状态、版本
- 关联数据：所有相关事件的引用

### Transfer
- 转账事件的完整记录
- 包含发送方、接收方、金额等信息

### Mint/Burn
- 代币铸造和销毁记录
- 包含相关交易ID和金额

### BatchTransfer
- 批量转账事件记录
- 包含接收人数组和金额数组

### WhitelistUpdate
- 白名单状态变更记录
- 记录账户和状态变更

### Account
- 账户实体，记录所有相关活动
- 包含所有转账、铸造、销毁等活动的引用

## 部署步骤

### 1. 安装依赖
```bash
cd pp-rwa-backend/subgraph
npm install
```

### 2. 生成代码
```bash
npm run codegen
```

### 3. 构建项目
```bash
npm run build
```

### 4. 本地部署
```bash
# 创建subgraph
npm run create-local

# 部署到本地节点
npm run deploy-local
```

### 5. 生产环境部署
```bash
# 部署到The Graph网络
npm run deploy
```

## 事件处理器

### 已实现的事件处理器
- `handleTransfer`: 处理标准ERC20转账事件
- `handleTokensMinted`: 处理代币铸造事件
- `handleTokensBurned`: 处理代币销毁事件
- `handleBatchTransferExecuted`: 处理批量转账事件
- `handleWhitelistUpdated`: 处理白名单更新事件
- `handlePaused`: 处理合约暂停事件
- `handleUnpaused`: 处理合约恢复事件

## 错误处理

### 常见问题及解决方案

1. **Token实体字段缺失**
   - 确保所有必需字段在创建时都被正确初始化
   - 使用try_*方法避免合约调用失败

2. **Immutable实体更新错误**
   - 确保事件实体保持immutable
   - 只有Token和Account实体可以更新

3. **@derivedFrom字段类型错误**
   - 确保引用的字段类型与目标实体类型匹配
   - 如果类型不匹配，移除@derivedFrom并手动管理关系

4. **网络配置错误**
   - 检查subgraph.yaml中的网络配置
   - 确保合约地址正确

5. **ABI不匹配**
   - 确保ABI文件与实际合约匹配
   - 重新生成ABI文件如果合约有更新

6. **包脚本中缺少YAML文件指定**
   - 确保所有graph CLI命令都指定了正确的YAML配置文件
   - 使用`graph codegen subgraph-local.yaml`而不是`graph codegen`

## GraphQL查询示例

### 查询代币信息
```graphql
query {
  token(id: "0x5FbDB2315678afecb367f032d93F642f64180aa3") {
    id
    name
    symbol
    decimals
    totalSupply
    owner
    isPaused
    version
    createdAt
    updatedAt
  }
}
```

### 查询转账记录
```graphql
query {
  transfers(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    from
    to
    amount
    timestamp
    transactionHash
    token {
      name
      symbol
    }
  }
}
```

### 查询账户活动
```graphql
query {
  account(id: "0x...") {
    id
    transfersFrom(first: 5) {
      amount
      timestamp
    }
    transfersTo(first: 5) {
      amount
      timestamp
    }
    mintsReceived(first: 5) {
      amount
      timestamp
    }
  }
}
```

## 监控和调试

### 查看subgraph状态
```bash
# 查看本地subgraph状态
curl http://localhost:8020/graphql
```

### 查看日志
```bash
# 查看graph node日志
docker logs graph-node
```

### 常见调试命令
```bash
# 重新生成代码
npm run codegen

# 重新构建
npm run build

# 重新部署
npm run deploy-local
```

## 性能优化

### 索引策略
- 使用适当的事件过滤器
- 合理设置实体关系
- 避免过度索引

### 查询优化
- 使用分页限制结果集大小
- 合理使用排序和过滤
- 避免深度嵌套查询

## 安全考虑

- 确保ABI文件来自可信源
- 定期更新依赖项
- 监控subgraph性能和错误率
- 实施适当的访问控制