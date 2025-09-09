# 🐳 Docker Compose 配置指南

## 📋 概述

本项目提供了两种 Graph Node 部署方式：

1. **简单方式**: 直接运行单个容器
2. **完整方式**: Docker Compose（推荐）

## 🚀 Docker Compose 方式（推荐）

### 优势
- ✅ **数据持久化**: 自动处理数据存储
- ✅ **完整服务栈**: 包含 PostgreSQL + IPFS + Graph Node
- ✅ **网络隔离**: 独立的网络环境
- ✅ **易于管理**: 一键启动/停止所有服务
- ✅ **配置灵活**: 可自定义各种参数

### 使用方法

#### 1. 启动完整环境
```bash
# 在项目根目录下
cd pp-rwa-backend

# 启动所有服务
docker-compose -f docker-compose.local.yml up -d

# 查看服务状态
docker-compose -f docker-compose.local.yml ps

# 查看日志
docker-compose -f docker-compose.local.yml logs -f graph-node
```

#### 2. 停止服务
```bash
# 停止所有服务
docker-compose -f docker-compose.local.yml down

# 停止并删除数据（谨慎使用）
docker-compose -f docker-compose.local.yml down -v
```

#### 3. 重启服务
```bash
# 重启特定服务
docker-compose -f docker-compose.local.yml restart graph-node

# 重启所有服务
docker-compose -f docker-compose.local.yml restart
```

## 🔧 配置说明

### 环境变量配置
```yaml
environment:
  postgres_host: postgres      # 数据库主机
  postgres_user: graph-node    # 数据库用户名
  postgres_password: let-me-in # 数据库密码
  ipfs: 'ipfs:5001'           # IPFS 服务地址
  ethereum: 'mainnet:http://host.docker.internal:8545'  # 以太坊节点
  RUST_LOG: info               # 日志级别
```

### 端口映射
| 容器端口 | 主机端口 | 用途 |
|----------|----------|------|
| 8000 | 8000 | GraphQL HTTP 接口 |
| 8001 | 8001 | GraphQL WebSocket 接口 |
| 8020 | 8020 | Indexer API |
| 8030 | 8030 | 指标监控 |
| 8040 | 8040 | 管理接口 |

### 数据持久化
- **PostgreSQL 数据**: `postgres_data` 卷
- **IPFS 数据**: `ipfs_data` 卷
- **数据位置**: Docker 默认卷存储路径

## 🌐 网络配置

### 本地 Anvil 连接
配置文件已优化为连接本地 Anvil：
```yaml
ethereum: 'mainnet:http://host.docker.internal:8545'
```

**注意**: 
- `host.docker.internal` 是 Docker Desktop 的特殊域名，指向宿主机
- 确保您的 Anvil 运行在宿主机的 8545 端口

### 验证连接
```bash
# 测试 Graph Node
curl http://localhost:8000/

# 测试数据库连接
docker exec -it graph-postgres psql -U graph-node -d graph-node

# 测试 IPFS
curl http://localhost:8080/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
```

## 🔄 与简单方式的对比

| 特性 | 简单方式 | Docker Compose |
|------|----------|----------------|
| **启动速度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **数据持久化** | ❌ | ✅ |
| **服务完整性** | ❌ | ✅ |
| **配置灵活性** | ❌ | ✅ |
| **生产适用性** | ❌ | ✅ |
| **学习价值** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🛠️ 故障排除

### 常见问题

#### 1. Graph Node 无法连接到 PostgreSQL
```bash
# 检查 PostgreSQL 日志
docker-compose logs postgres

# 验证数据库连接
docker exec -it graph-postgres psql -U graph-node -d graph-node
```

#### 2. Graph Node 无法连接到以太坊节点
```bash
# 验证 Anvil 是否运行
curl http://localhost:8545

# 检查 Graph Node 日志
docker-compose logs graph-node
```

#### 3. IPFS 连接问题
```bash
# 检查 IPFS 日志
docker-compose logs ipfs

# 测试 IPFS 连接
docker exec -it graph-ipfs ipfs id
```

### 调试技巧

#### 查看实时日志
```bash
# 查看所有服务日志
docker-compose -f docker-compose.local.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.local.yml logs -f graph-node
```

#### 进入容器调试
```bash
# 进入 Graph Node 容器
docker exec -it graph-node bash

# 进入 PostgreSQL 容器
docker exec -it graph-postgres bash

# 进入 IPFS 容器
docker exec -it graph-ipfs bash
```

## 📝 最佳实践

### 开发环境
1. **使用 `docker-compose.local.yml`**: 专门为本地开发优化
2. **定期备份数据**: 重要的索引数据需要备份
3. **监控资源使用**: Graph Node 比较消耗资源

### 生产环境
1. **使用更强的密码**: 修改默认的数据库密码
2. **配置资源限制**: 设置容器内存和 CPU 限制
3. **启用日志轮转**: 防止日志文件过大
4. **配置监控**: 添加 Prometheus 和 Grafana

## 🎯 推荐使用场景

### Docker Compose 推荐
- ✅ 长期开发项目
- ✅ 需要数据持久化
- ✅ 团队协作开发
- ✅ 生产环境部署
- ✅ 学习完整技术栈

### 简单方式推荐
- ✅ 快速验证概念
- ✅ 临时测试环境
- ✅ 资源有限的机器
- ✅ 初学者入门

**总结**: 对于您的 RWA 项目，建议使用 Docker Compose 方式，因为它提供了完整的生产环境体验和数据持久化。