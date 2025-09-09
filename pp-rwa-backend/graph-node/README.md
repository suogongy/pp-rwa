# RWA个人作品集项目 - Graph Node Docker配置

## 📁 项目结构

```
pp-rwa-backend/
├── graph-node/                    # Graph Node相关配置
│   ├── docker/
│   │   └── docker-compose.yml    # Docker Compose配置文件
│   ├── data/                     # 数据持久化目录
│   │   ├── graph-node/
│   │   ├── ipfs/
│   │   └── postgres/
│   └── README.md                 # Graph Node使用说明
├── src/                          # 后端API服务
├── subgraph/                     # The Graph子图配置
├── guides/                       # 配置指南
└── ...                           # 其他后端文件
```

## 🚀 使用方法

### 1. 启动Graph Node服务
```bash
# 进入graph-node目录
cd pp-rwa-backend/graph-node

# 启动所有服务
docker-compose -f docker/docker-compose.yml up -d

# 查看服务状态
docker-compose -f docker/docker-compose.yml ps

# 查看日志
docker-compose -f docker/docker-compose.yml logs -f
```

### 2. 停止服务
```bash
# 停止所有服务
docker-compose -f docker/docker-compose.yml down

# 停止并删除数据（谨慎使用）
docker-compose -f docker/docker-compose.yml down -v
```

## 🔧 服务说明

### 核心服务
- **graph-node**: 图节点服务 (端口: 8000, 8001, 8020, 8030, 8040)
- **ipfs**: IPFS存储服务 (端口: 5001, 8080)
- **postgres**: PostgreSQL数据库 (端口: 5432)

### 前置要求
确保本地Anvil运行在8545端口：
```bash
anvil --host 0.0.0.0 --port 8545
```

## 🎯 与后端API的关系

Graph Node为后端API服务提供区块链数据索引功能：
- Graph Node负责监听区块链事件并建立索引
- 后端API服务通过GraphQL查询Graph Node获取数据
- 后端API为前端提供RESTful接口

## 📝 开发工作流

1. **启动基础服务**: Graph Node + IPFS + PostgreSQL
2. **部署子图**: 部署RWA合约的子图配置
3. **启动后端API**: 运行Node.js API服务
4. **前端集成**: 前端调用后端API获取数据