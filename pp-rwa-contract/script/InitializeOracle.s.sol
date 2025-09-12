// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Script, console } from "forge-std/Script.sol";
import { RWAOracle } from "../src/RWAOracle.sol";

/**
 * @title InitializeOracle
 * @dev 预言机合约初始化脚本
 * 功能：
 * - 添加价格喂送配置
 * - 设置初始价格数据
 * - 验证合约功能
 */
contract InitializeOracle is Script {
    function run() external {
        // 从环境变量获取合约地址
        address oracleAddress = vm.envAddress("ORACLE_ADDRESS");
        
        // 开始广播（仅本地开发）
        vm.startBroadcast();
        
        RWAOracle oracle = RWAOracle(oracleAddress);
        
        console.log("开始初始化预言机合约...");
        console.log("合约地址:", oracleAddress);
        
        // 添加ETH价格喂送
        console.log("添加ETH价格喂送...");
        oracle.addPriceFeed("ETH", address(0), 8); // 8位小数
        
        // 添加BTC价格喂送
        console.log("添加BTC价格喂送...");
        oracle.addPriceFeed("BTC", address(0), 8);
        
        // 添加USD价格喂送
        console.log("添加USD价格喂送...");
        oracle.addPriceFeed("USD", address(0), 6);
        
        // 设置初始价格（模拟当前市场价格）
        console.log("设置初始ETH价格: $3500.00");
        oracle.updatePrice("ETH", 350000000000); // $3500.00, 8位小数
        
        console.log("设置初始BTC价格: $45000.00");
        oracle.updatePrice("BTC", 450000000000); // $45000.00, 8位小数
        
        console.log("设置初始USD价格: $1.00");
        oracle.updatePrice("USD", 1000000); // $1.00, 6位小数
        
        // 测试价格读取
        int256 ethPrice = oracle.getPrice("ETH");
        int256 btcPrice = oracle.getPrice("BTC");
        int256 usdPrice = oracle.getPrice("USD");
        
        console.log("验证ETH价格:", ethPrice);
        console.log("验证BTC价格:", btcPrice);
        console.log("验证USD价格:", usdPrice);
        
        // 测试随机数生成
        console.log("测试随机数生成...");
        uint256 seed = block.timestamp;
        uint256 requestId = oracle.requestRandomNumber(seed);
        console.log("随机数请求ID:", requestId);
        
        // 测试资产估值
        console.log("测试资产估值...");
        uint256 assetId = 1;
        oracle.requestAssetValuation(assetId, "ETH");
        uint256 valuation = oracle.getAssetValuation(assetId);
        console.log("资产估值:", valuation);
        
        vm.stopBroadcast();
        
        console.log("预言机合约初始化完成!");
        
        // 输出统计信息
        uint256 priceFeedCount = oracle.getPriceFeedCount();
        uint256 valuationCount = oracle.getAssetValuationCount();
        
        console.log("价格喂送数量:", priceFeedCount);
        console.log("资产估值数量:", valuationCount);
    }
}