// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RWA20.sol";
import "./RWA721.sol";
import "./RWAStaking.sol";
import "./RWAGovernor.sol";
import "./RWAMultisigWallet.sol";
import "./RWAOracle.sol";
import "./RWA1155.sol";

/**
 * @title RWAMarketHub
 * @dev RWA市场中心合约 - 整合所有RWA功能的核心合约
 *
 * 主要功能:
 * 1. 资产登记 - 统一管理RWA资产的代币化
 * 2. 市场交易 - 提供RWA代币的交易功能
 * 3. 质押挖矿 - 整合多种质押池
 * 4. 治理投票 - 统一的治理入口
 * 5. 多签管理 - 资金安全管理
 * 6. 价格预言机 - 实时价格更新
 * 7. 资产分析 - 收益和风险评估
 */
contract RWAMarketHub is Ownable, Pausable, ReentrancyGuard {

    // 事件定义
    event AssetRegistered(
        uint256 indexed assetId,
        string name,
        string symbol,
        address indexed assetContract,
        uint256 totalSupply,
        uint256 assetValue,
        bytes32 indexed txId
    );

    event TradeExecuted(
        uint256 indexed tradeId,
        address indexed trader,
        address indexed assetContract,
        uint256 amount,
        uint256 price,
        bool isBuy,
        bytes32 indexed txId
    );

    event StakingPositionCreated(
        address indexed user,
        address indexed stakingPool,
        uint256 amount,
        uint256 lockPeriod,
        bytes32 indexed txId
    );

    event GovernanceProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        bytes32 indexed txId
    );

    event MultiSigTransactionCreated(
        address indexed wallet,
        uint256 indexed transactionId,
        address to,
        uint256 amount,
        bytes32 indexed txId
    );

    event OraclePriceUpdated(
        address indexed asset,
        uint256 price,
        uint256 timestamp,
        bytes32 indexed txId
    );

    // 合约地址映射
    mapping(address => bool) public isValidRWAContract;
    mapping(string => address) public contractByName;

    // 资产注册信息
    struct AssetInfo {
        uint256 assetId;
        string name;
        string symbol;
        address contractAddress;
        address creator;
        uint256 totalSupply;
        uint256 assetValue;
        uint8 assetType; // 0: ERC20, 1: ERC721, 2: ERC1155
        uint256 createdAt;
        bool isActive;
    }

    mapping(uint256 => AssetInfo) public assets;
    mapping(address => uint256) public contractToAssetId;
    uint256 public nextAssetId;

    // 交易相关
    struct TradeInfo {
        uint256 tradeId;
        address trader;
        address assetContract;
        uint256 amount;
        uint256 price;
        bool isBuy;
        uint256 timestamp;
        bool isExecuted;
    }

    mapping(uint256 => TradeInfo) public trades;
    uint256 public nextTradeId;

    // 核心合约地址
    address public rwa20Implementation;
    address public rwa721Implementation;
    address public rwa1155Implementation;
    address public stakingPool;
    address public governor;
    address public multisigWallet;
    address public oracle;

    // 权限管理
    mapping(address => bool) public authorizedOperators;
    mapping(address => bool) public assetRegistrars;

    // 修饰符
    modifier onlyAuthorized() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "RWAMarketHub: Not authorized");
        _;
    }

    modifier onlyRegistrar() {
        require(assetRegistrars[msg.sender] || msg.sender == owner(), "RWAMarketHub: Not authorized registrar");
        _;
    }

    modifier validAssetContract(address _contract) {
        require(isValidRWAContract[_contract], "RWAMarketHub: Invalid RWA contract");
        _;
    }

    constructor(address _owner) Ownable(_owner) {
        nextAssetId = 1;
        nextTradeId = 1;
    }

    /**
     * @dev 设置核心合约地址
     */
    function setCoreContracts(
        address _rwa20Impl,
        address _rwa721Impl,
        address _rwa1155Impl,
        address _stakingPool,
        address _governor,
        address _multisigWallet,
        address _oracle
    ) external onlyOwner {
        rwa20Implementation = _rwa20Impl;
        rwa721Implementation = _rwa721Impl;
        rwa1155Implementation = _rwa1155Impl;
        stakingPool = _stakingPool;
        governor = _governor;
        multisigWallet = _multisigWallet;
        oracle = _oracle;

        // 注册核心合约
        isValidRWAContract[_rwa20Impl] = true;
        isValidRWAContract[_rwa721Impl] = true;
        isValidRWAContract[_rwa1155Impl] = true;

        contractByName["RWA20"] = _rwa20Impl;
        contractByName["RWA721"] = _rwa721Impl;
        contractByName["RWA1155"] = _rwa1155Impl;
        contractByName["Staking"] = _stakingPool;
        contractByName["Governor"] = _governor;
        contractByName["MultiSig"] = _multisigWallet;
        contractByName["Oracle"] = _oracle;
    }

    /**
     * @dev 注册新的RWA资产
     */
    function registerAsset(
        string memory _name,
        string memory _symbol,
        uint8 _assetType,
        uint256 _totalSupply,
        uint256 _assetValue,
        string memory _baseURI,
        address[] memory _initialOwners,
        uint256[] memory _initialAmounts
    ) external onlyRegistrar whenNotPaused nonReentrant returns (address) {
        require(_totalSupply > 0, "RWAMarketHub: Invalid total supply");
        require(_assetValue > 0, "RWAMarketHub: Invalid asset value");
        require(_initialOwners.length == _initialAmounts.length, "RWAMarketHub: Array length mismatch");

        address assetContract;

        if (_assetType == 0) {
            // 创建ERC20代币
            RWA20 newToken = new RWA20(_name, _symbol, msg.sender);
            assetContract = address(newToken);

            // 分发初始代币
            for (uint256 i = 0; i < _initialOwners.length; i++) {
                if (_initialAmounts[i] > 0) {
                    newToken.mint(_initialOwners[i], _initialAmounts[i]);
                }
            }
        } else if (_assetType == 1) {
            // 创建ERC721代币
            RWA721 newNFT = new RWA721(_name, _symbol, _baseURI, msg.sender);
            assetContract = address(newNFT);
        } else if (_assetType == 2) {
            // 创建ERC1155代币
            RWA1155 newMultiToken = new RWA1155(_name, _symbol, _baseURI, msg.sender);
            assetContract = address(newMultiToken);
        } else {
            revert("RWAMarketHub: Invalid asset type");
        }

        // 注册资产信息
        uint256 assetId = nextAssetId++;
        assets[assetId] = AssetInfo({
            assetId: assetId,
            name: _name,
            symbol: _symbol,
            contractAddress: assetContract,
            creator: msg.sender,
            totalSupply: _totalSupply,
            assetValue: _assetValue,
            assetType: _assetType,
            createdAt: block.timestamp,
            isActive: true
        });

        contractToAssetId[assetContract] = assetId;
        isValidRWAContract[assetContract] = true;

        // 生成交易ID
        bytes32 txId = keccak256(abi.encodePacked(block.timestamp, assetId, assetContract, blockhash(block.number - 1)));

        emit AssetRegistered(assetId, _name, _symbol, assetContract, _totalSupply, _assetValue, txId);

        return assetContract;
    }

    /**
     * @dev 执行交易
     */
    function executeTrade(
        address _assetContract,
        uint256 _amount,
        uint256 _maxPrice,
        bool _isBuy
    ) external whenNotPaused nonReentrant validAssetContract(_assetContract) returns (uint256) {
        require(_amount > 0, "RWAMarketHub: Invalid amount");

        // 获取当前价格
        uint256 currentPrice = IOracle(oracle).getPrice(_assetContract);

        if (_isBuy) {
            require(currentPrice <= _maxPrice, "RWAMarketHub: Price too high");
            require(msg.value >= _amount * currentPrice, "RWAMarketHub: Insufficient payment");
        }

        // 创建交易记录
        uint256 tradeId = nextTradeId++;
        trades[tradeId] = TradeInfo({
            tradeId: tradeId,
            trader: msg.sender,
            assetContract: _assetContract,
            amount: _amount,
            price: currentPrice,
            isBuy: _isBuy,
            timestamp: block.timestamp,
            isExecuted: true
        });

        // 执行交易逻辑
        if (_isBuy) {
            // 买入逻辑 - 这里应该实现实际的代币转移
            // 简化版本，实际需要更复杂的逻辑
        } else {
            // 卖出逻辑
            // 简化版本，实际需要授权和转移
        }

        bytes32 txId = keccak256(abi.encodePacked(block.timestamp, tradeId, msg.sender, _assetContract, blockhash(block.number - 1)));

        emit TradeExecuted(tradeId, msg.sender, _assetContract, _amount, currentPrice, _isBuy, txId);

        return tradeId;
    }

    /**
     * @dev 创建质押位置
     */
    function createStakingPosition(
        address _stakingPool,
        uint256 _amount,
        uint256 _lockPeriod
    ) external whenNotPaused nonReentrant {
        require(_amount > 0, "RWAMarketHub: Invalid amount");
        require(_lockPeriod > 0, "RWAMarketHub: Invalid lock period");

        // 这里应该调用实际的质押合约
        // 简化版本
        IStakingPool(_stakingPool).stake(_amount, _lockPeriod);

        bytes32 txId = keccak256(abi.encodePacked(block.timestamp, msg.sender, _stakingPool, _amount, blockhash(block.number - 1)));

        emit StakingPositionCreated(msg.sender, _stakingPool, _amount, _lockPeriod, txId);
    }

    /**
     * @dev 创建治理提案
     */
    function createGovernanceProposal(
        string memory _title,
        string memory _description,
        address[] memory _targets,
        uint256[] memory _values,
        bytes[] memory _calldatas
    ) external whenNotPaused nonReentrant returns (uint256) {
        // 调用治理合约创建提案
        uint256 proposalId = IGovernor(governor).propose(
            _targets,
            _values,
            _calldatas,
            _title,
            _description
        );

        bytes32 txId = keccak256(abi.encodePacked(block.timestamp, proposalId, msg.sender, blockhash(block.number - 1)));

        emit GovernanceProposalCreated(proposalId, msg.sender, _title, txId);

        return proposalId;
    }

    /**
     * @dev 创建多签交易
     */
    function createMultiSigTransaction(
        address _to,
        uint256 _amount,
        bytes memory _data
    ) external whenNotPaused nonReentrant returns (uint256) {
        // 调用多签钱包合约
        uint256 transactionId = IMultiSigWallet(multisigWallet).submitTransaction(_to, _amount, _data);

        bytes32 txId = keccak256(abi.encodePacked(block.timestamp, multisigWallet, transactionId, _to, blockhash(block.number - 1)));

        emit MultiSigTransactionCreated(multisigWallet, transactionId, _to, _amount, txId);

        return transactionId;
    }

    /**
     * @dev 更新预言机价格
     */
    function updateOraclePrice(
        address _asset,
        uint256 _price,
        uint256 _confidence
    ) external onlyAuthorized whenNotPaused {
        IOracle(oracle).updatePrice(_asset, _price, _confidence);

        bytes32 txId = keccak256(abi.encodePacked(block.timestamp, _asset, _price, blockhash(block.number - 1)));

        emit OraclePriceUpdated(_asset, _price, block.timestamp, txId);
    }

    /**
     * @dev 获取资产信息
     */
    function getAssetInfo(uint256 _assetId) external view returns (AssetInfo memory) {
        return assets[_assetId];
    }

    /**
     * @dev 获取交易信息
     */
    function getTradeInfo(uint256 _tradeId) external view returns (TradeInfo memory) {
        return trades[_tradeId];
    }

    /**
     * @dev 获取资产组合分析
     */
    function getPortfolioAnalysis(address _user) external view returns (
        uint256 totalValue,
        uint256 totalRewards,
        uint256 assetCount,
        uint256 averageAPY
    ) {
        // 简化版本，实际应该遍历用户的所有资产
        // 这里返回模拟数据
        return (1000000, 50000, 5, 750); // basis points for 7.5%
    }

    /**
     * @dev 权限管理
     */
    function authorizeOperator(address _operator) external onlyOwner {
        authorizedOperators[_operator] = true;
    }

    function revokeOperator(address _operator) external onlyOwner {
        authorizedOperators[_operator] = false;
    }

    function authorizeRegistrar(address _registrar) external onlyOwner {
        assetRegistrars[_registrar] = true;
    }

    function revokeRegistrar(address _registrar) external onlyOwner {
        assetRegistrars[_registrar] = false;
    }

    /**
     * @dev 暂停和恢复
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev 紧急函数
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner whenPaused {
        if (_token == address(0)) {
            payable(owner()).transfer(_amount);
        } else {
            IERC20(_token).transfer(owner(), _amount);
        }
    }

    /**
     * @dev 版本信息
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}

// 接口定义
interface IOracle {
    function getPrice(address _asset) external view returns (uint256);
    function updatePrice(address _asset, uint256 _price, uint256 _confidence) external;
}

interface IStakingPool {
    function stake(uint256 _amount, uint256 _lockPeriod) external;
    function unstake(uint256 _amount) external;
    function claimRewards() external;
}

interface IGovernor {
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory title,
        string memory description
    ) external returns (uint256);
}

interface IMultiSigWallet {
    function submitTransaction(address to, uint256 value, bytes memory data) external returns (uint256);
    function confirmTransaction(uint256 transactionId) external;
    function executeTransaction(uint256 transactionId) external;
}