# PP-RWA 网络配置指南

## 问题说明

如果您在浏览器控制台看到以下错误：
```
POST https://sepolia.public-rpc.com/ net::ERR_CERT_AUTHORITY_INVALID
```

这表明DApp仍在尝试连接到Sepolia测试网络，而不是本地的Anvil节点。

## 解决方案

### 方案1: 使用内置的重置功能（推荐）

1. 在DApp页面顶部，您会看到一个黄色的"网络配置问题"警告框
2. 点击"重置网络配置"按钮
3. 等待页面重新加载
4. 重新连接您的钱包

### 方案2: 手动清理浏览器缓存

1. **断开钱包连接**
   - 点击钱包连接按钮，选择"断开连接"

2. **清理浏览器存储**
   - 按F12打开开发者工具
   - 进入Console标签页
   - 输入以下命令并按Enter：
   ```javascript
   // 清理所有wagmi相关的localStorage
   for (let i = 0; i < localStorage.length; i++) {
     const key = localStorage.key(i);
     if (key && (key.includes('wagmi') || key.includes('wallet'))) {
       localStorage.removeItem(key);
     }
   }
   // 清理sessionStorage
   sessionStorage.clear();
   ```

3. **重新加载页面**
   - 按F5或Ctrl+R重新加载页面
   - 重新连接钱包

### 方案3: 手动在MetaMask中添加Anvil网络

如果上述方案不起作用，请手动在MetaMask中添加Anvil网络配置：

1. **打开MetaMask扩展**
2. **点击网络下拉菜单**（通常显示"以太坊主网"）
3. **点击"添加网络"**
4. **填写以下信息**：
   - **网络名称**: Anvil Local
   - **新的RPC URL**: http://127.0.0.1:8545
   - **链ID**: 31337
   - **货币符号**: ETH
   - **区块浏览器URL**: （留空）

5. **点击"保存"**

## 验证配置是否正确

配置完成后，您应该看到：

1. ✅ MetaMask显示网络为"Anvil Local"
2. ✅ 钱包地址以0xf39开头（Anvil默认账户）
3. ✅ 浏览器控制台不再出现Sepolia RPC错误
4. ✅ DApp界面显示"已连接"状态

## 启动Anvil节点

如果Anvil节点未运行，请执行：

```bash
# 在pp-rwa-contract目录下
anvil
```

确保看到类似输出：
```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
...
```

## 常见问题

**Q: 为什么会出现这个问题？**
A: 这是因为浏览器缓存了之前的网络配置，即使我们修改了代码，浏览器仍然使用旧的配置。

**Q: 重置后钱包没有自动连接到Anvil怎么办？**
A: 请确保MetaMask中已经添加了Anvil网络，然后手动切换到该网络。

**Q: Anvil节点连接不上怎么办？**
A:
1. 确认anvil正在运行（在终端中查看）
2. 确认RPC URL是 http://127.0.0.1:8545
3. 检查防火墙设置

## 技术细节

- **默认网络**: Anvil (Chain ID: 31337)
- **RPC地址**: http://127.0.0.1:8545
- **配置文件**: .env.local 和 src/lib/wagmi.ts
- **缓存键**: localStorage中以'wagmi'或'wallet'开头的键

如果问题持续存在，请检查环境变量配置是否正确加载。