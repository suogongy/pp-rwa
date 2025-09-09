# 🌍 PP-RWA Backend - 多环境区块链数据索引系统

## 📋 项目概述

这是一个完整的 **RWA（现实世界资产）代币交易历史查询系统**，支持多环境部署，包括本地 Anvil 开发和 Sepolia 测试网环境。该系统使用 The Graph 协议进行区块链数据索引，提供 RESTful API 接口供前端应用使用。

### 🎯 核心特性

- **🔄 多环境支持**: 本地 Anvil 开发 + Sepolia 测试环境
- **📊 实时数据索引**: 监听所有 RWA20 合约事件
- **🚀 高性能查询**: GraphQL + RESTful API 双重接口
- **🎛️ 智能环境切换**: 一键切换开发/测试环境
- **💰 成本优化**: 本地测试节省 Sepolia ETH

### 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐
│   Local Anvil   │    │  Sepolia Testnet │
│   Development   │    │      Testing     │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ Local Graph Node│    │ The Graph Hosted│
│  (Optional)     │    │    Service      │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
           ┌─────────────────┐
           │   Express API   │
           │    Server       │
           └─────────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │   Frontend DApp │
           └─────────────────┘
```

## 🚀 快速开始

### 📖 学习路径

本项目提供完整的文档体系，建议按以下路径学习：

#### 🎯 快速体验（5分钟）
如果您已经具备区块链开发经验，可以直接参考下方的"快速验证"部分。

#### 📚 深入学习（推荐）
为了深入理解系统原理和掌握完整配置，请阅读详细指南：

1. **🔧 环境配置指南**: [多环境配置原理和手动配置步骤](guides/ENVIRONMENT_CONFIG_GUIDE.md)
2. **📊 The Graph 配置指南**: [Subgraph 开发和部署详解](guides/THE_GRAPH_CONFIG_GUIDE.md)
3. **🚀 Subgraph 部署指南**: [完整部署流程和故障排除](guides/SUBGRAPH_DEPLOYMENT_GUIDE.md)

### ⚡ 快速验证

#### 环境准备
```bash
# 进入项目目录
cd pp-rwa-backend

# 安装依赖
npm install

# 复制环境配置模板
cp .env.example .env.local
cp .env.example .env.sepolia
```

#### 服务启动测试
```bash
# 切换到本地环境（默认配置）
cp .env.local .env

# 启动后端服务
npm run dev

# 服务启动后访问：
# http://localhost:3001/api/env     - 环境信息
# http://localhost:3001/health       - 健康检查
```

**注意**: 完整的部署配置请参考详细指南。上述步骤仅用于验证服务基本功能。

## 📁 项目结构

```
pp-rwa-backend/
├── subgraph/                    # The Graph subgraph
│   ├── schema.graphql          # GraphQL schema
│   ├── subgraph.yaml          # 主配置文件（Sepolia）
│   ├── subgraph-local.yaml     # 本地开发配置
│   ├── src/
│   │   └── rwa20-mapping.ts    # 事件映射逻辑
│   └── abis/
│       └── RWA20.json          # 合约ABI
├── guides/                     # 详细配置和部署指南
│   ├── ENVIRONMENT_CONFIG_GUIDE.md      # 环境配置原理和步骤
│   ├── THE_GRAPH_CONFIG_GUIDE.md        # The Graph 开发指南
│   └── SUBGRAPH_DEPLOYMENT_GUIDE.md    # 完整部署流程和故障排除
├── src/
│   └── index.ts                # Express API 服务器
├── .env                        # 当前环境配置
├── .env.example                # 环境配置模板
├── .env.local                  # 本地环境配置
├── .env.sepolia                # Sepolia 环境配置
├── package.json
├── tsconfig.json
└── README.md                   # 本文档
```

## 🔧 环境管理

### 多环境架构

系统支持两种运行环境，通过环境配置文件实现隔离：

- **本地环境**: 基于 Anvil 本地网络，用于开发和测试
- **测试环境**: 基于 Sepolia 测试网，用于作品集展示和模拟真实环境

### 环境配置

```bash
# 环境配置文件
.env.example        # 配置模板
.env.local          # 本地环境配置  
.env.sepolia        # Sepolia 测试环境配置
.env                # 当前激活的环境配置

# 环境切换命令
cp .env.local .env    # 切换到本地环境
cp .env.sepolia .env  # 切换到 Sepolia 环境
```

**详细配置步骤**: 请参考 [环境配置指南](guides/ENVIRONMENT_CONFIG_GUIDE.md)

## 📊 监听的事件类型

系统监听以下 RWA20 合约事件：

- **Transfer** (ERC20标准) - 代币转账
- **TokensMinted** - 代币铸造
- **TokensBurned** - 代币销毁
- **BatchTransferExecuted** - 批量转账
- **WhitelistUpdated** - 白名单更新

## 📡 API 端点

### 环境信息
- `GET /api/env` - 获取当前环境信息
- `GET /health` - 健康检查（包含环境信息）

### 代币信息
- `GET /api/token/:address` - 获取代币详细信息

### 交易记录查询
- `GET /api/transfers/token/:address` - 按代币地址查询转账记录
- `GET /api/transfers/account/:address` - 按账户地址查询交易记录
- `GET /api/mints/token/:address` - 按代币地址查询铸造记录
- `GET /api/burns/token/:address` - 按代币地址查询销毁记录
- `GET /api/batch-transfers/token/:address` - 按代币地址查询批量转账记录

### 查询参数
- `first` - 每页数量 (默认: 10, 最大: 100)
- `skip` - 跳过数量 (默认: 0)

### API 响应示例

```bash
# 获取环境信息
curl http://localhost:3001/api/env

# 响应:
{
  "current": "local",
  "config": {
    "name": "Local Anvil",
    "graphUrl": "http://localhost:8000/subgraphs/name/pp-rwa",
    "contractAddress": "0x..."
  },
  "available": ["local", "sepolia"]
}

# 获取代币转账记录
curl "http://localhost:3001/api/transfers/token/0xYourContractAddress?first=5&skip=0"

# 响应:
{
  "transfers": [
    {
      "id": "0x123...-1",
      "from": "0x...",
      "to": "0x...",
      "amount": "1000000000000000000",
      "blockNumber": 123456,
      "transactionHash": "0x...",
      "timestamp": "1634567890"
    }
  ]
}
```

## 🎨 前端集成示例

### React 组件示例

```javascript
import { useState, useEffect } from 'react';

function useEnvironment() {
  const [env, setEnv] = useState(null);
  
  useEffect(() => {
    fetch('/api/env')
      .then(res => res.json())
      .then(data => setEnv(data));
  }, []);
  
  return env;
}

function TokenTransactions({ tokenAddress }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [env, setEnv] = useState(null);

  useEffect(() => {
    // 获取环境信息和交易记录
    Promise.all([
      fetch('/api/env').then(res => res.json()),
      fetch(`/api/transfers/token/${tokenAddress}?first=10&skip=0`).then(res => res.json())
    ]).then(([envData, transfersData]) => {
      setEnv(envData);
      setTransfers(transfersData.transfers || []);
      setLoading(false);
    }).catch(error => {
      console.error('Error:', error);
      setLoading(false);
    });
  }, [tokenAddress]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="token-transactions">
      <div className="env-info">
        <h3>环境信息</h3>
        <p><strong>当前环境:</strong> {env?.config?.name}</p>
        <p><strong>合约地址:</strong> {env?.config?.contractAddress}</p>
        <p><strong>数据源:</strong> {env?.config?.graphUrl}</p>
      </div>
      
      <div className="transactions">
        <h3>交易记录</h3>
        {transfers.length === 0 ? (
          <p>暂无交易记录</p>
        ) : (
          <ul>
            {transfers.map((transfer) => (
              <li key={transfer.id} className="transfer-item">
                <div className="transfer-main">
                  <span className="address">{transfer.from}</span>
                  <span className="arrow">→</span>
                  <span className="address">{transfer.to}</span>
                  <span className="amount">{transfer.amount}</span>
                </div>
                <div className="transfer-meta">
                  <small>区块: {transfer.blockNumber}</small>
                  <small>时间: {new Date(Number(transfer.timestamp) * 1000).toLocaleString()}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

### 使用 fetch API

```javascript
// 获取代币信息
async function getTokenInfo(tokenAddress) {
  const response = await fetch(`/api/token/${tokenAddress}`);
  const data = await response.json();
  return data.token;
}

// 获取账户交易记录
async function getAccountTransactions(accountAddress, page = 0, pageSize = 10) {
  const response = await fetch(
    `/api/transfers/account/${accountAddress}?first=${pageSize}&skip=${page * pageSize}`
  );
  const data = await response.json();
  return {
    transfersFrom: data.transfersFrom || [],
    transfersTo: data.transfersTo || []
  };
}
```

## 🔄 The Graph 数据索引

### 技术架构

系统使用 The Graph 协议进行区块链数据索引：

- **本地环境**: 可选本地 Graph Node（用于开发调试）
- **测试环境**: The Graph Hosted Service（用于作品集展示）

### Subgraph 组件

```
subgraph/
├── schema.graphql          # 数据结构定义
├── subgraph.yaml          # Sepolia 环境配置
├── subgraph-local.yaml     # 本地环境配置
├── src/rwa20-mapping.ts    # 事件处理逻辑
└── abis/RWA20.json         # 合约接口定义
```

**详细部署指南**: 请参考 [The Graph 配置指南](guides/THE_GRAPH_CONFIG_GUIDE.md) 和 [Subgraph 部署指南](guides/SUBGRAPH_DEPLOYMENT_GUIDE.md)

## 🔍 故障排除

### 问题分类

**环境配置问题**
- 环境文件不存在或配置错误
- 环境切换失败
- 合约地址配置错误

**The Graph 问题**
- Subgraph 同步缓慢
- 部署失败
- 事件监听异常

**API 服务问题**
- 服务启动失败
- 查询无数据返回
- 网络连接问题

**调试工具**
```bash
# 基础检查
curl http://localhost:3001/api/env     # 环境信息
curl http://localhost:3001/health       # 健康状态
```

**详细故障排除**: 请参考各详细指南中的故障排除章节：
- [环境配置指南](guides/ENVIRONMENT_CONFIG_GUIDE.md) - 环境相关问题
- [The Graph 配置指南](guides/THE_GRAPH_CONFIG_GUIDE.md) - Subgraph 开发问题  
- [Subgraph 部署指南](guides/SUBGRAPH_DEPLOYMENT_GUIDE.md) - 部署和同步问题

## 🚀 性能优化

### 1. 查询优化
- 使用 `first` 和 `skip` 参数进行分页
- 避免过大的查询结果集
- 合并多个查询请求

### 2. 缓存策略
```bash
# 添加 Redis 缓存
npm install redis
npm install @types/redis
```

### 3. 监控和日志
```bash
# 添加监控
npm install prom-client

# 添加日志
npm install winston
```

## 🎯 部署策略

### 开发流程
1. **本地开发**: 使用 Anvil 本地网络进行功能开发和测试
2. **环境验证**: 在本地环境中验证所有合约事件和 API 功能
3. **测试部署**: 部署到 Sepolia 测试网进行端到端验证
4. **作品集展示**: 使用 Sepolia 环境作为作品集演示

### 关键检查点
- 环境配置正确性
- 合约地址和事件监听
- Subgraph 同步状态
- API 服务稳定性

**详细部署流程**: 请参考 [Subgraph 部署指南](guides/SUBGRAPH_DEPLOYMENT_GUIDE.md)

## 🛠️ 扩展功能

### 可添加的功能
- [ ] **缓存层**: Redis/Memcached
- [ ] **请求限流**: Rate limiting
- [ ] **API 认证**: JWT/API Keys
- [ ] **实时通知**: WebSockets
- [ ] **数据分析**: 交易统计仪表板
- [ ] **多链支持**: Ethereum L2, 其他测试网
- [ ] **高级查询**: 复杂的 GraphQL 查询
- [ ] **监控告警**: Prometheus + Grafana

### 高级配置示例

```bash
# 添加缓存支持
npm install redis @types/redis ioredis

# 添加监控
npm install prom-client express-prometheus-middleware

# 添加认证
npm install jsonwebtoken @types/jsonwebtoken passport passport-jwt

# 添加文档
npm install swagger-ui-express yamljs
```

## 📚 相关资源

### 核心技术
- [The Graph 文档](https://thegraph.com/docs/)
- [The Graph Studio](https://thegraph.com/studio/)
- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Foundry](https://getfoundry.sh/)

### 区块链网络
- [Sepolia 测试网](https://sepolia.etherscan.io/)
- [Infura](https://infura.io/)
- [Alchemy](https://www.alchemy.com/)

### 开发工具
- [Graph CLI](https://github.com/graphprotocol/graph-cli)
- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)

## 📄 许可证

ISC License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📖 文档导航

- **📋 项目概述**: 本文档 - 系统架构和快速验证
- **🔧 环境配置**: [环境配置指南](guides/ENVIRONMENT_CONFIG_GUIDE.md) - 多环境配置详解
- **📊 The Graph**: [The Graph 配置指南](guides/THE_GRAPH_CONFIG_GUIDE.md) - 数据索引开发
- **🚀 部署流程**: [Subgraph 部署指南](guides/SUBGRAPH_DEPLOYMENT_GUIDE.md) - 完整部署步骤

**建议阅读顺序**: 项目概述 → 环境配置 → The Graph 配置 → 部署流程