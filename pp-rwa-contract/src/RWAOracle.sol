// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RWAOracle
 * @dev RWA项目预言机合约（简化版本）
 * 功能特点：
 * - 价格数据存储
 * - 随机数生成（伪随机）
 * - 资产估值
 * 
 * 注意：此为简化版本，生产环境应集成Chainlink等去中心化预言机
 */
contract RWAOracle is Ownable {
    constructor() Ownable(msg.sender) {
    }
    
    // 价格喂送配置
    struct PriceFeed {
        address feedAddress;
        string symbol;
        uint8 decimals;
        int256 latestPrice;
        uint256 lastUpdate;
        bool active;
    }
    
    // 资产估值配置
    struct AssetValuation {
        uint256 assetId;
        uint256 valueUSD;
        uint256 lastUpdate;
        bool verified;
    }
    
    // 随机数请求
    struct RandomRequest {
        address requester;
        uint256 seed;
        uint256 timestamp;
        bool fulfilled;
        uint256[] result;
    }
    
    // 价格喂送映射
    mapping(string => PriceFeed) public priceFeeds;
    string[] public priceFeedSymbols;
    
    // 资产估值映射
    mapping(uint256 => AssetValuation) public assetValuations;
    uint256[] public assetValuationIds;
    
    // 随机数请求映射
    mapping(uint256 => RandomRequest) public randomRequests;
    uint256 public randomRequestCount;
    
    // 随机数种子
    uint256 private _randomSeed;
    
    // 事件
    event PriceFeedUpdated(string symbol, int256 price, uint256 timestamp);
    event AssetValuationRequested(uint256 assetId, string symbol);
    event AssetValuationUpdated(uint256 assetId, uint256 valueUSD, uint256 timestamp);
    event RandomnessRequested(uint256 requestId, address requester);
    event RandomnessFulfilled(uint256 requestId, uint256[] result);
    
    /**
     * @dev 添加价格喂送
     */
    function addPriceFeed(
        string memory symbol,
        address feedAddress,
        uint8 decimals
    ) external onlyOwner {
        require(feedAddress != address(0), "Invalid feed address");
        require(bytes(symbol).length > 0, "Invalid symbol");
        
        priceFeeds[symbol] = PriceFeed({
            feedAddress: feedAddress,
            symbol: symbol,
            decimals: decimals,
            latestPrice: 0,
            lastUpdate: 0,
            active: true
        });
        
        priceFeedSymbols.push(symbol);
        emit PriceFeedUpdated(symbol, 0, block.timestamp);
    }
    
    /**
     * @dev 更新价格（模拟预言机数据）
     */
    function updatePrice(string memory symbol, int256 price) external onlyOwner {
        require(priceFeeds[symbol].active, "Price feed not active");
        
        priceFeeds[symbol].latestPrice = price;
        priceFeeds[symbol].lastUpdate = block.timestamp;
        
        emit PriceFeedUpdated(symbol, price, block.timestamp);
    }
    
    /**
     * @dev 获取价格
     */
    function getPrice(string memory symbol) external view returns (int256) {
        require(priceFeeds[symbol].active, "Price feed not active");
        return priceFeeds[symbol].latestPrice;
    }
    
    /**
     * @dev 请求资产估值
     */
    function requestAssetValuation(uint256 assetId, string memory symbol) external {
        require(priceFeeds[symbol].active, "Price feed not active");
        
        emit AssetValuationRequested(assetId, symbol);
        
        // 简化版本：直接使用当前价格
        uint256 valueUSD = uint256(priceFeeds[symbol].latestPrice);
        assetValuations[assetId] = AssetValuation({
            assetId: assetId,
            valueUSD: valueUSD,
            lastUpdate: block.timestamp,
            verified: true
        });
        
        assetValuationIds.push(assetId);
        emit AssetValuationUpdated(assetId, valueUSD, block.timestamp);
    }
    
    /**
     * @dev 获取资产估值
     */
    function getAssetValuation(uint256 assetId) external view returns (uint256) {
        return assetValuations[assetId].valueUSD;
    }
    
    /**
     * @dev 请求随机数
     */
    function requestRandomNumber(uint256 seed) external returns (uint256) {
        randomRequestCount++;
        uint256 requestId = randomRequestCount;
        
        randomRequests[requestId] = RandomRequest({
            requester: msg.sender,
            seed: seed,
            timestamp: block.timestamp,
            fulfilled: false,
            result: new uint256[](0)
        });
        
        emit RandomnessRequested(requestId, msg.sender);
        
        // 简化版本：立即生成伪随机数
        _generateRandomNumber(requestId);
        
        return requestId;
    }
    
    /**
     * @dev 生成随机数（简化版本）
     */
    function _generateRandomNumber(uint256 requestId) internal {
        RandomRequest storage request = randomRequests[requestId];
        
        // 使用区块哈希、时间戳和种子生成伪随机数
        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),
                    block.timestamp,
                    request.seed,
                    _randomSeed
                )
            )
        );
        
        request.result = new uint256[](1);
        request.result[0] = randomNumber;
        request.fulfilled = true;
        
        _randomSeed = randomNumber;
        
        emit RandomnessFulfilled(requestId, request.result);
    }
    
    /**
     * @dev 获取随机数结果
     */
    function getRandomNumber(uint256 requestId) external view returns (uint256[] memory) {
        require(randomRequests[requestId].fulfilled, "Randomness not fulfilled");
        return randomRequests[requestId].result;
    }
    
    /**
     * @dev 获取价格喂送数量
     */
    function getPriceFeedCount() external view returns (uint256) {
        return priceFeedSymbols.length;
    }
    
    /**
     * @dev 获取资产估值数量
     */
    function getAssetValuationCount() external view returns (uint256) {
        return assetValuationIds.length;
    }
    
    /**
     * @dev 接收ETH
     */
    receive() external payable {}
}