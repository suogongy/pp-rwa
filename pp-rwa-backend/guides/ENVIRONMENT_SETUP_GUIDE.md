# 🔧 环境配置指南

## 🎯 概述

本指南详细介绍如何配置多环境系统，支持本地开发和测试环境的快速切换。

## 📋 环境管理概念

### 为什么需要多环境？

1. **开发环境**: 本地测试，节省 Gas 费用
2. **测试环境**: Sepolia 测试网，作品集展示，模拟真实环境
3. **环境隔离**: 避免配置冲突
4. **快速切换**: 根据需要选择环境

### 环境文件结构

```
pp-rwa-backend/
├── .env                    # 当前激活的环境配置
├── .env.example            # 配置模板
├── .env.local              # 本地开发环境配置
├── .env.sepolia            # Sepolia 测试环境配置
└── guides/                 # 配置指南
```

## 🛠️ 手动环境配置

### 1. 创建环境配置文件

#### 步骤 1: 复制模板文件

```bash
# 进入项目根目录
cd pp-rwa-backend

# 复制模板文件
cp .env.example .env.local
cp .env.example .env.sepolia
```

#### 步骤 2: 配置本地开发环境

编辑 `.env.local` 文件：

```bash
# 使用文本编辑器打开
nano .env.local
# 或
vim .env.local
# 或使用 VS Code
code .env.local
```

配置内容：

```env
# 本地开发环境配置
NODE_ENV=development
PORT=3001

# Local Anvil 配置
LOCAL_GRAPH_URL=http://localhost:8000/subgraphs/name/pp-rwa-local
LOCAL_RPC_URL=http://localhost:8545
LOCAL_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Sepolia 配置（本地环境时不需要，但保留结构）
SEPOLIA_GRAPH_URL=https://api.thegraph.com/subgraphs/name/YOUR_USERNAME/YOUR_SUBGRAPH_NAME
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# 当前环境标识
CURRENT_ENV=local
```

#### 步骤 3: 配置测试环境

编辑 `.env.sepolia` 文件：

```bash
code .env.sepolia
```

配置内容：

```env
# Sepolia 测试环境配置
NODE_ENV=development
PORT=3001

# Local Anvil 配置（测试环境时不需要，但保留结构）
LOCAL_GRAPH_URL=http://localhost:8000/subgraphs/name/pp-rwa-local
LOCAL_RPC_URL=http://localhost:8545
LOCAL_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Sepolia 配置
SEPOLIA_GRAPH_URL=https://api.thegraph.com/subgraphs/name/YOUR_USERNAME/YOUR_SUBGRAPH_NAME
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_CONTRACT_ADDRESS=0xYourSepoliaContractAddress

# 当前环境标识
CURRENT_ENV=sepolia
```

### 2. 环境切换

```bash
# 切换到本地环境
cp .env.local .env
echo "已切换到本地环境"

# 切换到 Sepolia 环境
cp .env.sepolia .env
echo "已切换到 Sepolia 环境"
```

### 3. 验证环境配置

#### 创建验证脚本

创建 `verify-env.js` 文件：

```javascript
require('dotenv').config();

function verifyEnvironment() {
  const requiredVars = [
    'NODE_ENV',
    'PORT', 
    'CURRENT_ENV',
    'LOCAL_GRAPH_URL',
    'LOCAL_RPC_URL',
    'SEPOLIA_GRAPH_URL',
    'SEPOLIA_RPC_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ 缺少环境变量:', missingVars.join(', '));
    return false;
  }
  
  const currentEnv = process.env.CURRENT_ENV;
  console.log(`✅ 当前环境: ${currentEnv}`);
  
  if (currentEnv === 'local') {
    console.log(`📍 Graph URL: ${process.env.LOCAL_GRAPH_URL}`);
    console.log(`🔗 RPC URL: ${process.env.LOCAL_RPC_URL}`);
    
    if (!process.env.LOCAL_CONTRACT_ADDRESS || process.env.LOCAL_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      console.warn('⚠️  本地合约地址未配置');
    }
  } else if (currentEnv === 'sepolia') {
    console.log(`📍 Graph URL: ${process.env.SEPOLIA_GRAPH_URL}`);
    console.log(`🔗 RPC URL: ${process.env.SEPOLIA_RPC_URL}`);
    
    if (!process.env.SEPOLIA_CONTRACT_ADDRESS || process.env.SEPOLIA_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      console.warn('⚠️  Sepolia 合约地址未配置');
    }
  }
  
  return true;
}

verifyEnvironment();
```

使用方法：

```bash
# 验证当前环境配置
node verify-env.js
```

## 📋 环境配置详解

### 环境变量说明

#### 基础配置
- `NODE_ENV`: Node.js 运行环境 (development/production)
- `PORT`: API 服务端口
- `CURRENT_ENV`: 当前区块链环境 (local/sepolia)

#### 本地开发配置
- `LOCAL_GRAPH_URL`: 本地 Graph Node URL
- `LOCAL_RPC_URL`: 本地 Anvil RPC URL
- `LOCAL_CONTRACT_ADDRESS`: 本地合约地址

#### Sepolia 测试配置
- `SEPOLIA_GRAPH_URL`: The Graph Hosted Service URL
- `SEPOLIA_RPC_URL`: Sepolia RPC URL
- `SEPOLIA_CONTRACT_ADDRESS`: Sepolia 合约地址

### 获取配置值的方法

#### 1. 本地合约地址

```bash
# 部署合约到本地
cd ../pp-rwa-contract
forge script script/DeployRWA20.s.sol:DeployToLocal --rpc-url http://localhost:8545 --broadcast

# 从输出中提取合约地址
# 格式通常为：Contract Address: 0x...
```

#### 2. Sepolia 合约地址

```bash
# 部署合约到 Sepolia
cd ../pp-rwa-contract
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
forge script script/DeployRWA20.s.sol:DeployToSepolia --rpc-url $SEPOLIA_RPC_URL --broadcast

# 从广播文件中提取地址
cat broadcast/DeployRWA20.s.sol/11155111/run-latest.json | jq -r '.transactions[] | select(.contractName == "RWA20") | .contractAddress'
```

#### 3. Infura 密钥

1. 访问 [Infura](https://infura.io/)
2. 注册账户
3. 创建新项目
4. 选择 Sepolia 网络
5. 复制项目 ID

#### 4. The Graph Subgraph URL

1. 访问 [The Graph Studio](https://thegraph.com/studio/)
2. 创建新项目
3. 部署 subgraph
4. 获得 URL: `https://api.thegraph.com/subgraphs/name/username/project-name`

## 🚀 完整配置流程

### 本地开发环境设置

#### 步骤 1: 启动本地服务

```bash
# 启动 Anvil
anvil --host 0.0.0.0 --port 8545 --chain-id 31337 --block-time 2

# 启动 Graph Node (使用 Docker Compose)
cd pp-rwa-backend/graph-node
docker-compose -f docker/docker-compose.yml up -d
```

#### 步骤 2: 部署合约

```bash
# 部署到本地
cd ../pp-rwa-contract
forge script script/DeployRWA20.s.sol:DeployToLocal --rpc-url http://localhost:8545 --broadcast

# 记录合约地址
```

#### 步骤 3: 更新配置

```bash
# 更新本地配置
cd ../pp-rwa-backend
# 编辑 .env.local 文件，设置 LOCAL_CONTRACT_ADDRESS

# 切换到本地环境
cp .env.local .env
```

#### 步骤 4: 部署本地 subgraph

```bash
cd subgraph
npm run codegen
npm run build
npm run create-local
npm run deploy-local
```

#### 步骤 5: 启动 API 服务

```bash
cd ..
npm run dev
```

### Sepolia 测试环境设置

#### 步骤 1: 部署合约到 Sepolia

```bash
cd ../pp-rwa-contract
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
forge script script/DeployRWA20.s.sol:DeployToSepolia --rpc-url $SEPOLIA_RPC_URL --broadcast
```

#### 步骤 2: 部署 subgraph

```bash
cd ../pp-rwa-backend/subgraph
graph auth https://api.thegraph.com/deploy/ YOUR_ACCESS_TOKEN
graph codegen --config subgraph-production.yaml
graph build --config subgraph-production.yaml
graph create --node https://api.thegraph.com/deploy/ your-username/your-project-name
graph deploy --node https://api.thegraph.com/deploy/ your-username/your-project-name
```

#### 步骤 3: 更新配置

```bash
# 编辑 .env.sepolia 文件
# 设置 SEPOLIA_CONTRACT_ADDRESS
# 设置 SEPOLIA_GRAPH_URL
# 设置 SEPOLIA_RPC_URL

# 切换到 Sepolia 环境
cp .env.sepolia .env
```

#### 步骤 4: 启动服务

```bash
cd ..
npm run dev
```

## 🛠️ 故障排除

### 常见问题

#### 1. 环境变量未加载

```bash
# 检查环境变量
node -e "console.log(process.env)"

# 重新加载配置
source .env  # Linux/Mac
# 或重启终端
```

#### 2. 配置文件不存在

```bash
# 检查文件是否存在
ls -la .env*

# 重新创建配置文件
cp .env.example .env.local
cp .env.example .env.sepolia
```

#### 3. 端口冲突

```bash
# 检查端口占用
lsof -i :3001
netstat -an | grep 3001

# 修改端口
# 编辑 .env 文件，修改 PORT=3002
```

#### 4. 合约地址错误

```bash
# 验证合约地址
cast 0xYourContractAddress --rpc-url your-rpc-url

# 检查合约字节码
cast code 0xYourContractAddress --rpc-url your-rpc-url
```

### 调试技巧

#### 1. 环境变量调试

```javascript
// 创建 debug-env.js
console.log('所有环境变量:');
console.log(JSON.stringify(process.env, null, 2));

console.log('\n配置相关变量:');
const configVars = Object.keys(process.env).filter(key => 
  key.includes('URL') || key.includes('ADDRESS') || key.includes('ENV')
);
configVars.forEach(key => {
  console.log(`${key}: ${process.env[key]}`);
});
```

#### 2. 配置验证

```bash
# 创建验证脚本
cat > validate-config.sh << 'EOF'
#!/bin/bash

echo "验证环境配置..."

# 检查必需文件
files=(".env" ".env.local" ".env.sepolia")
for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ 缺少文件: $file"
    exit 1
  fi
done

# 检查环境变量
source .env
if [ -z "$CURRENT_ENV" ]; then
  echo "❌ CURRENT_ENV 未设置"
  exit 1
fi

echo "✅ 配置验证通过"
echo "🌍 当前环境: $CURRENT_ENV"
EOF

chmod +x validate-config.sh
./validate-config.sh
```

## 📚 最佳实践

### 1. 配置文件管理

```bash
# 添加到 .gitignore
echo "# 环境配置" >> .gitignore
echo ".env" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### 2. 配置模板维护

```bash
# 更新模板时同步更新所有环境文件
cp .env.example .env.local
cp .env.example .env.sepolia
# 然后分别编辑特定配置
```

### 3. 文档记录

```markdown
# 在项目文档中记录配置步骤

## 环境配置
1. 复制 `cp .env.example .env.local`
2. 编辑 `.env.local` 设置本地配置
3. 复制 `cp .env.example .env.sepolia`
4. 编辑 `.env.sepolia` 设置生产配置
5. 使用 `cp .env.local .env` 切换环境
```

### 4. 自动化脚本

创建环境切换脚本：

```bash
# 创建 switch-env.sh
cat > switch-env.sh << 'EOF'
#!/bin/bash

if [ -z "$1" ]; then
  echo "用法: ./switch-env.sh [local|sepolia]"
  exit 1
fi

ENV=$1

if [ "$ENV" = "local" ]; then
  cp .env.local .env
  echo "已切换到本地环境"
elif [ "$ENV" = "sepolia" ]; then
  cp .env.sepolia .env
  echo "已切换到 Sepolia 环境"
else
  echo "不支持的环境: $ENV"
  exit 1
fi

# 验证配置
node verify-env.js
EOF

chmod +x switch-env.sh

# 使用方法
./switch-env.sh local
./switch-env.sh sepolia
```

## 🎯 学习要点

通过环境配置的学习，您将掌握：

1. **环境隔离**: 理解为什么需要多环境配置
2. **配置管理**: 如何有效管理不同环境的配置
3. **自动化**: 创建脚本简化环境切换
4. **调试技能**: 环境配置问题的诊断和解决
5. **最佳实践**: 生产级环境配置的标准方法

这些技能对于任何全栈开发项目都非常重要！