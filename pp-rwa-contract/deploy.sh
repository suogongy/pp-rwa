#!/bin/bash

# RWA20 合约部署脚本
# 使用环境变量进行灵活部署

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查环境变量
check_env() {
    if [ -z "$PRIVATE_KEY" ]; then
        echo -e "${RED}错误: PRIVATE_KEY 环境变量未设置${NC}"
        echo "请在 .env 文件中设置 PRIVATE_KEY"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "RWA20 合约部署脚本"
    echo ""
    echo "用法:"
    echo "  $0 [网络]"
    echo ""
    echo "网络选项:"
    echo "  local    - 本地开发网络 (默认)"
    echo "  sepolia  - Sepolia 测试网"
    echo "  mainnet  - 以太坊主网"
    echo ""
    echo "环境变量:"
    echo "  PRIVATE_KEY          - 部署者私钥 (必需)"
    echo "  LOCAL_RPC_URL        - 本地网络 RPC URL (默认: http://localhost:8545)"
    echo "  SEPOLIA_RPC_URL      - Sepolia 网络 RPC URL"
    echo "  MAINNET_RPC_URL      - 主网 RPC URL"
    echo "  TOKEN_NAME           - 代币名称 (默认: Real World Asset Token)"
    echo "  TOKEN_SYMBOL         - 代币符号 (默认: RWA)"
    echo "  ETHERSCAN_API_KEY    - Etherscan API Key (用于合约验证)"
    echo ""
    echo "示例:"
    echo "  # 部署到本地网络"
    echo "  $0 local"
    echo ""
    echo "  # 部署到 Sepolia 测试网"
    echo "  $0 sepolia"
    echo ""
    echo "  # 自定义代币名称和符号"
    echo "  export TOKEN_NAME=\"My Token\""
    echo "  export TOKEN_SYMBOL=\"MTK\""
    echo "  $0 local"
}

# 部署到指定网络
deploy() {
    local network=$1
    local script_contract=""
    local rpc_url=""
    local verify_flag=""
    
    case $network in
        local)
            script_contract="DeployToLocal"
            rpc_url="${LOCAL_RPC_URL:-http://localhost:8545}"
            echo -e "${BLUE}部署到本地网络...${NC}"
            echo "RPC URL: $rpc_url"
            
            # 检查本地网络是否运行
            if ! curl -s "$rpc_url" > /dev/null 2>&1; then
                echo -e "${YELLOW}本地网络未运行，启动 Anvil...${NC}"
                anvil --host 0.0.0.0 --port 8545 &
                ANVIL_PID=$!
                sleep 3
            fi
            ;;
        sepolia)
            script_contract="DeployToSepolia"
            rpc_url="$SEPOLIA_RPC_URL"
            verify_flag="--verify --etherscan-api-key $ETHERSCAN_API_KEY"
            echo -e "${BLUE}部署到 Sepolia 测试网...${NC}"
            echo "RPC URL: $rpc_url"
            ;;
        mainnet)
            script_contract="DeployToMainnet"
            rpc_url="$MAINNET_RPC_URL"
            verify_flag="--verify --etherscan-api-key $ETHERSCAN_API_KEY"
            echo -e "${RED}部署到以太坊主网...${NC}"
            echo "RPC URL: $rpc_url"
            echo -e "${RED}⚠️  警告：这是主网部署，请确认！ ⚠️${NC}"
            read -p "确认继续? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "取消部署"
                exit 1
            fi
            ;;
        *)
            echo -e "${RED}错误: 不支持的网络 $network${NC}"
            show_help
            exit 1
            ;;
    esac
    
    # 检查 RPC URL
    if [ -z "$rpc_url" ]; then
        echo -e "${RED}错误: $network 网络的 RPC URL 未设置${NC}"
        echo "请在 .env 文件中设置 ${network^^}_RPC_URL"
        exit 1
    fi
    
    # 显示部署信息
    echo -e "${YELLOW}部署信息:${NC}"
    echo "网络: $network"
    echo "代币名称: ${TOKEN_NAME:-Real World Asset Token}"
    echo "代币符号: ${TOKEN_SYMBOL:-RWA}"
    echo "脚本: $script_contract"
    echo ""
    
    # 构建合约
    echo -e "${YELLOW}构建合约...${NC}"
    forge build
    
    # 部署合约
    echo -e "${YELLOW}部署合约...${NC}"
    forge script script/DeployRWA20.s.sol:$script_contract \
        --rpc-url "$rpc_url" \
        --broadcast \
        $verify_flag \
        --legacy
    
    # 获取合约地址
    local contract_address=$(grep -o '"0x[a-fA-F0-9]\{40\}"' broadcast/DeployRWA20.s.sol/*/run-latest.json | head -1 | tr -d '"')
    
    if [ -n "$contract_address" ]; then
        echo -e "${GREEN}部署成功!${NC}"
        echo -e "${GREEN}合约地址: $contract_address${NC}"
        
        # 保存合约地址到文件
        echo "$contract_address" > contract_address.txt
        echo "合约地址已保存到 contract_address.txt"
        
        # 显示合约信息
        echo -e "${YELLOW}合约信息:${NC}"
        echo "代币名称: ${TOKEN_NAME:-Real World Asset Token}"
        echo "代币符号: ${TOKEN_SYMBOL:-RWA}"
        echo "合约地址: $contract_address"
        echo "网络: $network"
        
        # 生成前端配置
        echo -e "${YELLOW}生成前端配置...${NC}"
        cat > frontend-config.json << EOF
{
  "contractAddress": "$contract_address",
  "tokenName": "${TOKEN_NAME:-Real World Asset Token}",
  "tokenSymbol": "${TOKEN_SYMBOL:-RWA}",
  "network": "$network",
  "rpcUrl": "$rpc_url"
}
EOF
        echo "前端配置已保存到 frontend-config.json"
        
    else
        echo -e "${RED}部署失败，无法获取合约地址${NC}"
        exit 1
    fi
}

# 清理进程
cleanup() {
    if [ ! -z "$ANVIL_PID" ]; then
        kill $ANVIL_PID 2>/dev/null || true
        echo -e "${YELLOW}Anvil 进程已停止${NC}"
    fi
}

# 设置退出时的清理
trap cleanup EXIT

# 主程序
main() {
    # 检查参数
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_help
        exit 0
    fi
    
    # 设置网络 (默认为 local)
    local network="${1:-local}"
    
    # 检查环境变量
    check_env
    
    # 加载环境变量
    if [ -f ".env" ]; then
        echo -e "${YELLOW}加载环境变量...${NC}"
        export $(cat .env | xargs)
    fi
    
    # 部署
    deploy "$network"
    
    echo -e "${GREEN}部署完成!${NC}"
}

# 运行主程序
main "$@"