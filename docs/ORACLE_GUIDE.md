# RWA预言机系统使用指南

## 概述

RWA预言机系统为现实世界资产代币化项目提供可靠的数据源，包括价格数据、随机数生成和资产估值功能。

## 主要功能

### 1. 价格数据喂送
- **功能**: 提供各种资产的价格数据到链上
- **支持的资产**: ETH、BTC、USD等
- **精度**: 8位小数
- **更新方式**: 合约所有者可手动更新价格

### 2. 随机数生成
- **功能**: 生成可验证的伪随机数
- **用途**: NFT抽奖、游戏、随机分配等
- **安全性**: 基于区块哈希和时间戳
- **可追溯**: 每个随机数都有唯一的请求ID

### 3. 资产估值
- **功能**: 基于价格数据对资产进行估值
- **输入**: 资产ID + 价格标识
- **输出**: 资产的USD估值
- **精度**: 18位小数

## 快速开始

### 1. 部署合约

```bash
# 进入合约目录
cd pp-rwa-contract

# 部署并测试预言机合约
forge script script/DeployAndTestOracle.s.sol --broadcast --rpc-url http://localhost:8545
```

### 2. 配置前端环境

在 `pp-rwa-frontend/.env` 文件中添加：

```env
NEXT_PUBLIC_RWA_ORACLE_ADDRESS=0x你的合约地址
```

### 3. 启动前端

```bash
cd pp-rwa-frontend
npm run dev
```

## 使用流程

### 步骤1: 初始化预言机

1. 打开前端应用
2. 导航到"预言机管理"页面
3. 如果预言机未初始化，点击"初始化预言机"按钮
4. 等待交易确认

### 步骤2: 更新价格数据

1. 在预言机管理页面，点击"更新ETH价格"
2. 系统会生成随机价格变动（±$100）
3. 等待交易确认
4. 价格数据会自动更新显示

### 步骤3: 生成随机数

1. 点击"生成随机数"按钮
2. 系统使用当前时间戳作为种子
3. 生成随机数并显示
4. 可以多次生成不同的随机数

### 步骤4: 请求资产估值

1. 点击"请求资产估值"按钮
2. 系统会基于当前ETH价格对资产ID 1进行估值
3. 估值结果会显示在界面上

## 技术细节

### 合约结构

```solidity
contract RWAOracle is Ownable {
    // 价格喂送配置
    struct PriceFeed {
        address feedAddress;
        string symbol;
        uint8 decimals;
        int256 latestPrice;
        uint256 lastUpdate;
        bool active;
    }
    
    // 核心功能函数
    function addPriceFeed(string memory symbol, address feedAddress, uint8 decimals) external onlyOwner;
    function updatePrice(string memory symbol, int256 price) external onlyOwner;
    function getPrice(string memory symbol) external view returns (int256);
    function requestRandomNumber(uint256 seed) external returns (uint256);
    function getRandomNumber(uint256 requestId) external view returns (uint256[] memory);
    function requestAssetValuation(uint256 assetId, string memory symbol) external;
    function getAssetValuation(uint256 assetId) external view returns (uint256);
}
```

### 前端集成

前端使用 wagmi 和 viem 与合约交互：

```typescript
// 读取价格数据
const { data: currentEthPrice } = useReadContract({
  address: RWAOracle_ADDRESS,
  abi: RWAOracle_ABI,
  functionName: 'getPrice',
  args: ['ETH'],
})

// 更新价格
const { writeContract } = useWriteContract()
writeContract({
  address: RWAOracle_ADDRESS,
  abi: RWAOracle_ABI,
  functionName: 'updatePrice',
  args: ['ETH', newPrice],
})
```

## 测试方法

### 自动化测试

```bash
# 运行合约测试
forge test --match-contract RWAOracleTest

# 部署并测试完整流程
forge script script/DeployAndTestOracle.s.sol --broadcast
```

### 手动测试

1. **价格更新测试**:
   - 初始化预言机
   - 更新ETH价格
   - 验证价格显示正确

2. **随机数测试**:
   - 生成多个随机数
   - 验证随机数不同
   - 验证随机数可追溯

3. **资产估值测试**:
   - 请求资产估值
   - 验证估值基于当前价格
   - 验证估值精度正确

## 注意事项

### 安全考虑

1. **所有权控制**: 只有合约所有者可以更新价格
2. **价格精度**: 注意不同资产的小数位数
3. **随机数安全**: 当前为伪随机数，生产环境应使用Chainlink VRF
4. **数据验证**: 在使用价格数据前应验证时间戳

### 生产环境建议

1. **使用Chainlink**: 生产环境应集成Chainlink价格喂送
2. **添加访问控制**: 限制特定地址的访问权限
3. **添加事件监听**: 监听价格更新和随机数生成事件
4. **数据缓存**: 前端应缓存价格数据，减少链上查询

## 故障排除

### 常见问题

1. **价格显示为0**:
   - 检查是否已初始化预言机
   - 确认价格喂送已添加
   - 验证价格已设置

2. **随机数生成失败**:
   - 检查合约地址是否正确
   - 确认网络连接正常
   - 验证用户权限

3. **资产估值为0**:
   - 确认对应的价格数据存在
   - 检查资产ID是否正确
   - 验证价格喂送是否激活

### 日志查看

```bash
# 查看前端控制台日志
# 打开浏览器开发者工具 -> Console

# 查看合约交易日志
# 使用Etherscan或区块浏览器查看交易详情
```

## 未来扩展

### 计划功能

1. **Chainlink集成**: 集成真实的Chainlink价格喂送
2. **多链支持**: 支持多个区块链网络
3. **更多资产**: 支持股票、商品等更多资产类型
4. **高级随机数**: 集成Chainlink VRF提供可验证随机数
5. **数据历史**: 存储历史价格数据供分析

### API扩展

```solidity
// 计划中的功能
function requestPriceFromChainlink(string memory symbol) external;
function getHistoricalPrice(string memory symbol, uint256 timestamp) external view returns (int256);
function requestVRFRandomNumber(uint256 seed) external returns (uint256);
```

## 总结

RWA预言机系统为项目提供了完整的数据服务基础设施。通过这个系统，用户可以：

- 获取实时的资产价格数据
- 生成安全的随机数
- 进行资产估值
- 为DeFi应用提供可靠的数据源

系统设计简洁、功能完整，同时具备良好的扩展性，可以根据项目需求不断迭代和完善。