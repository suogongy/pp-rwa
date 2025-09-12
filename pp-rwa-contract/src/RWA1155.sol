// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RWA1155
 * @dev 现实世界资产多代币标准合约，支持ERC-1155标准
 * 功能特点：
 * - 支持同质化和非同质化代币
 * - 批量转账和批量铸造
 * - 白名单控制
 * - URI管理
 */
contract RWA1155 is ERC1155, Ownable {
    // 代币类型计数器
    uint256 private _tokenIds;
    
    // 代币信息结构
    struct TokenInfo {
        string name;
        string symbol;
        uint256 totalSupply;
        bool isMintable;
        bool isBurnable;
        bool isTransferable;
    }
    
    // 代币ID到信息的映射
    mapping(uint256 => TokenInfo) public tokenInfos;
    
    // 白名单映射
    mapping(address => bool) private _whitelist;
    
    // 代币白名单映射
    mapping(uint256 => mapping(address => bool)) private _tokenWhitelist;
    
    // 事件
    event TokenCreated(
        uint256 indexed tokenId, 
        string name, 
        string symbol, 
        address indexed creator
    );
    event WhitelistUpdated(address indexed account, bool status);
    event TokenWhitelistUpdated(uint256 indexed tokenId, address indexed account, bool status);
    event BaseURIUpdated(string newURI);
    
    /**
     * @dev 构造函数
     * @param baseURI_ 基础URI
     */
    constructor(
        string memory baseURI_
    ) ERC1155(baseURI_) Ownable(msg.sender) {
        _tokenIds = 0;
    }
    
    /**
     * @dev 创建新的代币类型
     * @param name 代币名称
     * @param symbol 代币符号
     * @param initialSupply 初始供应量
     * @param isMintable 是否可增发
     * @param isBurnable 是否可销毁
     * @param isTransferable 是否可转移
     * @param data 附加数据
     * @return tokenId 新代币ID
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        bool isMintable,
        bool isBurnable,
        bool isTransferable,
        bytes memory data
    ) external onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 tokenId = _tokenIds;
        
        tokenInfos[tokenId] = TokenInfo({
            name: name,
            symbol: symbol,
            totalSupply: initialSupply,
            isMintable: isMintable,
            isBurnable: isBurnable,
            isTransferable: isTransferable
        });
        
        if (initialSupply > 0) {
            _mint(msg.sender, tokenId, initialSupply, data);
        }
        
        emit TokenCreated(tokenId, name, symbol, msg.sender);
        return tokenId;
    }
    
    /**
     * @dev 批量铸造代币
     * @param to 接收地址
     * @param tokenIds 代币ID数组
     * @param amounts 数量数组
     * @param data 附加数据
     */
    function mintBatch(
        address to,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(tokenInfos[tokenId].isMintable, "Token not mintable");
            tokenInfos[tokenId].totalSupply += amounts[i];
        }
        _mintBatch(to, tokenIds, amounts, data);
    }
    
    /**
     * @dev 批量销毁代币
     * @param account 账户地址
     * @param tokenIds 代币ID数组
     * @param amounts 数量数组
     */
    function burnBatch(
        address account,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(tokenInfos[tokenId].isBurnable, "Token not burnable");
            tokenInfos[tokenId].totalSupply -= amounts[i];
        }
        _burnBatch(account, tokenIds, amounts);
    }
    
    /**
     * @dev 更新白名单
     * @param account 账户地址
     * @param status 状态
     */
    function setWhitelist(address account, bool status) external onlyOwner {
        _whitelist[account] = status;
        emit WhitelistUpdated(account, status);
    }
    
    /**
     * @dev 更新代币白名单
     * @param tokenId 代币ID
     * @param account 账户地址
     * @param status 状态
     */
    function setTokenWhitelist(
        uint256 tokenId,
        address account,
        bool status
    ) external onlyOwner {
        _tokenWhitelist[tokenId][account] = status;
        emit TokenWhitelistUpdated(tokenId, account, status);
    }
    
    /**
     * @dev 设置基础URI
     * @param newURI 新URI
     */
    function setURI(string memory newURI) external onlyOwner {
        _setURI(newURI);
        emit BaseURIUpdated(newURI);
    }
    
    /**
     * @dev 获取代币数量
     * @return 代币类型数量
     */
    function getTokenCount() external view returns (uint256) {
        return _tokenIds;
    }
    
    /**
     * @dev 检查账户是否在白名单中
     * @param account 账户地址
     * @return 是否在白名单中
     */
    function isWhitelisted(address account) external view returns (bool) {
        return _whitelist[account];
    }
    
    /**
     * @dev 检查代币白名单
     * @param tokenId 代币ID
     * @param account 账户地址
     * @return 是否在白名单中
     */
    function isTokenWhitelisted(uint256 tokenId, address account) external view returns (bool) {
        return _tokenWhitelist[tokenId][account];
    }
    
    /**
     * @dev 转账前的检查
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal override virtual {
        
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 tokenId = ids[i];
            require(tokenInfos[tokenId].isTransferable, "RWA1155: token is not transferable");
            
            // 检查白名单
            bool whitelistCheck = _whitelist[from] || _whitelist[to] || 
                                _tokenWhitelist[tokenId][from] || _tokenWhitelist[tokenId][to];
            require(whitelistCheck, "RWA1155: transfer not allowed");
        }
        
        super._update(from, to, ids, amounts);
    }
}