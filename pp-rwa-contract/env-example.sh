#!/bin/bash

# 环境变量使用示例脚本
# 演示如何在 Foundry 中使用环境变量

echo "=== RWA20 环境变量使用示例 ==="
echo ""

# 加载环境变量
if [ -f ".env" ]; then
    echo "加载 .env 文件..."
    export $(cat .env | xargs)
fi

# 显示当前环境变量
echo "当前环境变量:"
echo "PRIVATE_KEY: ${PRIVATE_KEY:0:10}... (已设置)"
echo "LOCAL_RPC_URL: $LOCAL_RPC_URL"
echo "TOKEN_NAME: ${TOKEN_NAME:-Real World Asset Token}"
echo "TOKEN_SYMBOL: ${TOKEN_SYMBOL:-RWA}"
echo ""

# 示例 1: 基本部署命令
echo "=== 示例 1: 基本部署命令 ==="
echo "# 部署到本地网络"
echo "forge script script/DeployRWA20.s.sol:DeployToLocal \\"
echo "  --rpc-url \${LOCAL_RPC_URL} \\"
echo "  --broadcast"
echo ""

# 示例 2: 使用环境变量设置代币参数
echo "=== 示例 2: 自定义代币参数 ==="
echo "# 设置自定义代币名称和符号"
echo "export TOKEN_NAME=\"我的代币\""
echo "export TOKEN_SYMBOL=\"MTK\""
echo ""
echo "# 部署时将使用自定义参数"
echo "forge script script/DeployRWA20.s.sol:DeployToLocal \\"
echo "  --rpc-url \${LOCAL_RPC_URL} \\"
echo "  --broadcast"
echo ""

# 示例 3: 部署到测试网
echo "=== 示例 3: 部署到测试网 ==="
echo "# 部署到 Sepolia 测试网"
echo "forge script script/DeployRWA20.s.sol:DeployToSepolia \\"
echo "  --rpc-url \${SEPOLIA_RPC_URL} \\"
echo "  --broadcast \\"
echo "  --verify \\"
echo "  --etherscan-api-key \${ETHERSCAN_API_KEY}"
echo ""

# 示例 4: 使用 Cast 命令与环境变量
echo "=== 示例 4: 使用 Cast 命令 ==="
echo "# 查询合约信息 (需要先部署并获取合约地址)"
echo "cast call \${CONTRACT_ADDRESS} \"name()(string)\" --rpc-url \${LOCAL_RPC_URL}"
echo "cast call \${CONTRACT_ADDRESS} \"symbol()(string)\" --rpc-url \${LOCAL_RPC_URL}"
echo "cast call \${CONTRACT_ADDRESS} \"totalSupply()(uint256)\" --rpc-url \${LOCAL_RPC_URL}"
echo ""

# 示例 5: 测试命令
echo "=== 示例 5: 测试命令 ==="
echo "# 运行测试"
echo "forge test"
echo ""
echo "# 运行特定测试"
echo "forge test --match-contract RWA20Test"
echo ""
echo "# 生成 Gas 报告"
echo "forge test --gas-report"
echo ""

# 示例 6: 交互式命令
echo "=== 示例 6: 交互式命令 ==="
echo "# 启动本地节点"
echo "anvil --host 0.0.0.0 --port 8545 &"
echo ""
echo "# 部署合约"
echo "forge script script/DeployRWA20.s.sol:DeployToLocal \\"
echo "  --rpc-url \${LOCAL_RPC_URL} \\"
echo "  --broadcast"
echo ""
echo "# 发送交易"
echo "cast send \${CONTRACT_ADDRESS} \"transfer(address,uint256)\" \\"
echo "  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \\"
echo "  1000000000000000000 \\"
echo "  --private-key \${PRIVATE_KEY} \\"
echo "  --rpc-url \${LOCAL_RPC_URL}"
echo ""

echo "=== 环境变量配置文件示例 (.env) ==="
cat << 'EOF'
# 本地开发网络
LOCAL_RPC_URL=http://127.0.0.1:8545

# 部署者私钥（测试用，不要在生产环境使用）
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 代币配置（可选）
TOKEN_NAME=Real World Asset Token
TOKEN_SYMBOL=RWA

# Infura API Key
INFURA_API_KEY=your_infura_api_key_here

# Etherscan API Key（合约验证用）
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# 网络配置
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/${INFURA_API_KEY}
MAINNET_RPC_URL=https://mainnet.infura.io/v3/${INFURA_API_KEY}
EOF

echo ""
echo "=== 快速开始 ==="
echo "1. 复制环境变量配置文件:"
echo "   cp .env.example .env"
echo ""
echo "2. 编辑 .env 文件，填入你的配置"
echo ""
echo "3. 启动本地节点:"
echo "   anvil --host 0.0.0.0 --port 8545"
echo ""
echo "4. 部署合约:"
echo "   ./deploy.sh local"
echo ""
echo "5. 运行测试:"
echo "   forge test"
echo ""
echo "=== 完成 ==="