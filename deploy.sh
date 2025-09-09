#!/bin/bash

# RWA系统部署脚本
# 支持多环境部署：本地、测试网、主网

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
ENVIRONMENT=${1:-local}
NETWORK=""
RPC_URL=""
PRIVATE_KEY=""
ETHERSCAN_API_KEY=""

# 根据环境设置网络配置
case $ENVIRONMENT in
    local)
        NETWORK="localhost"
        RPC_URL="http://localhost:8545"
        PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        ;;
    sepolia)
        NETWORK="sepolia"
        RPC_URL="${SEPOLIA_RPC_URL}"
        PRIVATE_KEY="${PRIVATE_KEY}"
        ETHERSCAN_API_KEY="${ETHERSCAN_API_KEY}"
        ;;
    mainnet)
        NETWORK="mainnet"
        RPC_URL="${MAINNET_RPC_URL}"
        PRIVATE_KEY="${PRIVATE_KEY}"
        ETHERSCAN_API_KEY="${ETHERSCAN_API_KEY}"
        ;;
    *)
        echo -e "${RED}错误: 不支持的环境 $ENVIRONMENT${NC}"
        echo "支持的环境: local, sepolia, mainnet"
        exit 1
        ;;
esac

echo -e "${YELLOW}开始部署 RWA 系统到 $ENVIRONMENT 环境...${NC}"

# 检查必要的环境变量
if [ "$ENVIRONMENT" != "local" ]; then
    if [ -z "$RPC_URL" ]; then
        echo -e "${RED}错误: RPC_URL 环境变量未设置${NC}"
        exit 1
    fi
    if [ -z "$PRIVATE_KEY" ]; then
        echo -e "${RED}错误: PRIVATE_KEY 环境变量未设置${NC}"
        exit 1
    fi
fi

# 部署智能合约
echo -e "${YELLOW}部署智能合约...${NC}"
cd pp-rwa-contract

# 安装依赖（如果需要）
if [ ! -d "lib" ]; then
    echo -e "${YELLOW}安装 Foundry 依赖...${NC}"
    forge install foundry-rs/forge-std --no-commit
fi

# 构建合约
echo -e "${YELLOW}构建合约...${NC}"
forge build

# 运行测试（本地环境）
if [ "$ENVIRONMENT" == "local" ]; then
    echo -e "${YELLOW}运行测试...${NC}"
    forge test -v
fi

# 部署合约
echo -e "${YELLOW}部署合约到 $NETWORK...${NC}"
if [ "$ENVIRONMENT" == "local" ]; then
    # 启动本地节点（如果未运行）
    if ! pgrep -f "anvil" > /dev/null; then
        echo -e "${YELLOW}启动本地 Anvil 节点...${NC}"
        anvil --host 0.0.0.0 --port 8545 --mnemonic "test test test test test test test test test test test junk" &
        ANVIL_PID=$!
        sleep 3
    fi
    
    # 部署优化版本到本地网络
    forge script script/DeployRWA20Upgraded.s.sol:DeployRWA20Upgraded --rpc-url $RPC_URL --broadcast --legacy
else
    # 部署优化版本到测试网/主网
    forge script script/DeployRWA20Upgraded.s.sol:DeployRWA20Upgraded --rpc-url $RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY --legacy
fi

# 获取合约地址
CONTRACT_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "RWA20") | .contractAddress' broadcast/DeployRWA20.s.sol/$RUN_ID/run-latest.json 2>/dev/null || echo "")
if [ -z "$CONTRACT_ADDRESS" ]; then
    # 尝试从广播文件中提取地址
    CONTRACT_ADDRESS=$(grep -o '"0x[a-fA-F0-9]\{40\}"' broadcast/DeployRWA20.s.sol/*/run-latest.json | head -1 | tr -d '"')
fi

if [ -n "$CONTRACT_ADDRESS" ]; then
    echo -e "${GREEN}合约部署成功! 地址: $CONTRACT_ADDRESS${NC}"
    
    # 更新前端配置
    echo -e "${YELLOW}更新前端配置...${NC}"
    cd ../pp-rwa-frontend
    
    # 更新环境变量
    if [ -f ".env.local" ]; then
        sed -i.bak "s/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env.local
        rm .env.local.bak
    else
        echo "NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" > .env.local
    fi
    
    # 构建前端
    echo -e "${YELLOW}构建前端应用...${NC}"
    npm run build
    
    echo -e "${GREEN}前端构建完成!${NC}"
else
    echo -e "${RED}警告: 无法获取合约地址${NC}"
fi

# 清理本地进程
if [ ! -z "$ANVIL_PID" ]; then
    kill $ANVIL_PID 2>/dev/null || true
fi

echo -e "${GREEN}部署完成!${NC}"
echo -e "${YELLOW}下一步:${NC}"
echo "1. 更新钱包连接项目ID: https://cloud.walletconnect.com"
echo "2. 配置环境变量: cp pp-rwa-frontend/.env.example pp-rwa-frontend/.env.local"
echo "3. 启动开发服务器: cd pp-rwa-frontend && npm run dev"