# PP-RWA Stage3 治理系统使用指南

## 概述

PP-RWA Stage3 实现了一个基于OpenZeppelin Governor合约的DAO治理系统，允许代币持有者通过提案和投票来参与协议的治理决策。本文档详细介绍如何使用治理系统创建和管理提案。

## 系统架构

### 核心组件

1. **RWAGovernor合约** - 基于OpenZeppelin Governor的治理核心
2. **RWA20代币** - 治理投票权重代币
3. **GovernanceManagement组件** - 前端治理界面
4. **RWAMultisigWallet** - 多重签名钱包（备用治理机制）

### 治理流程

```
提案创建 → 投票期 → 执行期 → 结果处理
```

## 当前系统状态

### 已实现功能
- ✅ 治理合约部署和配置
- ✅ 前端治理界面
- ✅ 投票权重显示
- ✅ 基础提案管理UI

### 需要完善的部分
- ⚠️ RWAGovernor_ABI需要补充完整的治理函数
- ⚠️ 提案数据获取和显示机制
- ⚠️ 提案状态追踪
- ⚠️ 投票记录和统计

## 创建提案的具体流程

### 1. 准备工作

在使用治理系统前，确保：
- 已连接钱包
- 持有足够的RWA20代币（达到提案门槛）
- 治理合约已正确部署

### 2. 提案创建参数说明

创建提案需要以下参数：

#### 目标合约地址 (target)
这是提案要操作的合约地址。针对系统现有合约，可以使用以下地址：

```typescript
// RWA20代币合约
RWA20_ADDRESS = process.env.NEXT_PUBLIC_RWA20_ADDRESS

// RWA721 NFT合约  
RWA721_ADDRESS = process.env.NEXT_PUBLIC_RWA721_ADDRESS

// RWAStaking质押合约
RWAStaking_ADDRESS = process.env.NEXT_PUBLIC_RWA_STAKING_ADDRESS

// RWA1155多代币合约
RWA1155_ADDRESS = process.env.NEXT_PUBLIC_RWA1155_ADDRESS

// RWAMultisigWallet多签钱包
RWAMultisigWallet_ADDRESS = process.env.NEXT_PUBLIC_RWA_MULTISIG_WALLET_ADDRESS
```

#### 发送ETH数量 (value)
- 对于不涉及ETH转移的合约调用，设置为 `0`
- 对于需要发送ETH的提案，设置具体数量（以wei为单位）

#### 调用数据 (calldata)
这是提案的核心，包含要执行的合约函数调用。需要根据具体目标合约和操作来构造。

#### 提案描述 (description)
详细说明提案的目的、内容和预期影响。

### 3. 针对现有合约的提案示例

#### 示例1：修改RWA20合约的铸造权限

**目标**：为RWA20合约添加新的铸造地址

**参数设置**：
- 目标地址：`RWA20_ADDRESS`
- ETH数量：`0`
- 调用数据：`addToWhitelist(newAddress)`的编码
- 描述：`"为RWA20合约添加新的铸造地址：0x..."`

**calldata构造**：
```typescript
// 使用ethers.js或web3.js编码函数调用
const calldata = ethers.utils.interface.encodeFunctionData(
  'addToWhitelist',
  ['0xNewAddress...']
);
```

#### 示例2：RWA721合约版税设置

**目标**：修改特定NFT的版税接收地址和比例

**参数设置**：
- 目标地址：`RWA721_ADDRESS`
- ETH数量：`0`
- 调用数据：`setRoyaltyInfo(tokenId, recipient, percentage)`的编码
- 描述：`"修改NFT #tokenId版税设置为地址0x...，比例5%"`

**calldata构造**：
```typescript
const calldata = ethers.utils.interface.encodeFunctionData(
  'setRoyaltyInfo',
  [tokenId, '0xRecipient...', 500] // 5% = 500 (基点)
);
```

#### 示例3：RWAStaking合约参数调整

**目标**：调整质押合约的基础奖励率

**参数设置**：
- 目标地址：`RWAStaking_ADDRESS`
- ETH数量：`0`
- 调用数据：对应 setter 函数的编码
- 描述：`"将质押基础奖励率从X%调整为Y%"`

#### 示例4：多签钱包 signer 管理

**目标**：添加或移除多签钱包的签名者

**参数设置**：
- 目标地址：`RWAMultisigWallet_ADDRESS`
- ETH数量：`0`
- 调用数据：`addSigner(newSigner)` 或 `removeSigner(signerToRemove)` 的编码
- 描述：`"添加新的多签签名者：0x..."`

### 4. calldata构造方法

#### 使用ethers.js构造
```typescript
import { ethers } from 'ethers';

// 创建合约接口
const rwa20Interface = new ethers.utils.Interface(RWA20_ABI);

// 编码函数调用
const calldata = rwa20Interface.encodeFunctionData(
  'addToWhitelist',
  ['0x1234567890123456789012345678901234567890']
);
```

#### 使用web3.js构造
```javascript
const Web3 = require('web3');
const web3 = new Web3();

// 编码函数调用
const calldata = web3.eth.abi.encodeFunctionCall(
  {
    name: 'addToWhitelist',
    type: 'function',
    inputs: [{ type: 'address', name: 'account' }]
  },
  ['0x1234567890123456789012345678901234567890']
);
```

#### 手动构造（高级用法）
对于复杂操作，可能需要手动构造calldata：

```typescript
// 函数选择器 (前4字节)
const functionSelector = '0x40c10f19'; // mint(address,uint256)的选择器

// 参数编码 (每个32字节)
const address = '0x1234567890123456789012345678901234567890'.padStart(64, '0');
const amount = '0de0b6b3a7640000'.padStart(64, '0'); // 100 ETH in wei

const calldata = functionSelector + address + amount;
```

### 5. 投票和执行流程

#### 投票权重
投票权重基于持有的RWA20代币数量：
- 1 RWA20 = 1 票
- 需要在投票时保持代币余额

#### 投票选项
- **赞成 (For)**: 支持提案执行
- **反对 (Against)**: 反对提案执行
- **弃权 (Abstain)**: 中立立场

#### 提案状态
1. **活跃**: 投票期内，可以投票
2. **已执行**: 提案通过并已执行
3. **失败**: 提案未通过或过期

### 6. 前端界面使用

#### 创建提案界面
1. 进入Stage3治理页面
2. 填写提案描述
3. 输入目标合约地址
4. 设置ETH数量（通常为0）
5. 输入调用数据（calldata）
6. 点击"创建提案"

#### 投票界面
1. 在提案列表中找到目标提案
2. 点击"赞成"、"反对"或"弃权"按钮
3. 确认交易

#### 执行提案
1. 等待投票期结束
2. 如果提案通过，点击"执行"按钮
3. 确认执行交易

## 常见用例

### 1. 合约升级
通过治理提案升级系统合约：
- 目标：代理合约或升级合约
- calldata：升级函数调用
- 需要：技术团队详细的安全评估

### 2. 参数调整
调整系统参数：
- 质押利率
- 手续费率
- 白名单管理
- 阈值设置

### 3. 资金管理
管理协议资金：
- 资金转移
- 投资决策
- 预算分配

### 4. 紧急情况
紧急情况处理：
- 暂停合约
- 资金提取
- 安全修复

## 注意事项

### 安全考虑
1. **calldata验证**: 确保调用数据正确性
2. **权限检查**: 确认目标合约权限设置
3. **测试验证**: 在测试网充分测试
4. **法律合规**: 确保提案内容合规

### 最佳实践
1. **提案描述**: 详细说明提案目的和影响
2. **社区讨论**: 提案前进行社区讨论
3. **逐步执行**: 复杂变更分多个提案
4. **透明公开**: 保持决策过程透明

### 技术限制
1. **Gas限制**: 复杂提案可能超过gas限制
2. **时间约束**: 投票期和执行期有时间限制
3. **投票门槛**: 需要达到法定人数和通过率
4. **合约兼容性**: 确保目标合约兼容治理调用

## 故障排除

### 常见问题
1. **提案创建失败**
   - 检查代币余额是否达到门槛
   - 确认calldata格式正确
   - 验证目标合约地址

2. **投票失败**
   - 确认投票期内
   - 检查代币余额
   - 验证钱包权限

3. **执行失败**
   - 确认提案已通过
   - 检查执行权限
   - 验证目标合约状态

### 调试方法
1. 使用浏览器开发者工具查看错误信息
2. 检查区块链浏览器交易记录
3. 验证合约事件日志
4. 联系技术支持

## 未来发展

### 计划功能
- [ ] 提案模板系统
- [ ] 自动化calldata生成
- [ ] 投票委托机制
- [ ] 治理数据分析
- [ ] 跨链治理支持

### 改进方向
1. 用户体验优化
2. 安全机制增强
3. 治理效率提升
4. 社区参与度提高

## 技术支持

如需技术支持，请联系：
- 开发团队：[联系方式]
- 社区论坛：[论坛地址]
- 文档更新：[文档仓库]

---

**注意**: 本文档基于当前系统状态编写，随着系统更新可能需要相应调整。请在使用前确认最新的合约地址和ABI定义。