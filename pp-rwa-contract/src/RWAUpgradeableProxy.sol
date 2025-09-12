// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RWAUpgradeableProxy
 * @dev RWA项目可升级代理合约（简化版本）
 * 功能特点：
 * - 透明代理模式
 * - 安全升级机制
 * - 版本管理
 */
contract RWAUpgradeableProxy is Ownable {
    constructor() Ownable(msg.sender) {
    }
    
    // 代理合约映射
    mapping(address => bool) public isProxy;
    address[] public proxyAddresses;
    
    // 实现合约映射
    mapping(address => address) public implementation;
    
    // 版本信息
    struct VersionInfo {
        address implementation;
        uint256 version;
        uint256 timestamp;
        address upgradedBy;
    }
    
    mapping(address => VersionInfo[]) public versionHistory;
    
    // 事件
    event ProxyCreated(address indexed proxy, address indexed implementation, uint256 version);
    event Upgraded(address indexed proxy, address indexed implementation, uint256 version);
    event UpgradeScheduled(address indexed proxy, address indexed implementation, uint256 timestamp);
    
    /**
     * @dev 创建新的代理合约
     * @param implementation_ 实现合约地址
     * @param data_ 初始化数据
     * @return proxy 代理合约地址
     */
    function createProxy(
        address implementation_,
        bytes memory data_
    ) external onlyOwner returns (address) {
        require(implementation_ != address(0), "Invalid implementation");
        
        ERC1967Proxy proxy = new ERC1967Proxy(implementation_, data_);
        
        isProxy[address(proxy)] = true;
        proxyAddresses.push(address(proxy));
        
        implementation[address(proxy)] = implementation_;
        
        versionHistory[address(proxy)].push(VersionInfo({
            implementation: implementation_,
            version: 1,
            timestamp: block.timestamp,
            upgradedBy: msg.sender
        }));
        
        emit ProxyCreated(address(proxy), implementation_, 1);
        return address(proxy);
    }
    
    /**
     * @dev 升级代理合约 (简化版本)
     * @param proxy_ 代理合约地址
     * @param newImplementation_ 新实现合约地址
     */
    function upgrade(
        address proxy_,
        address newImplementation_
    ) external onlyOwner {
        require(isProxy[proxy_], "Invalid proxy");
        require(newImplementation_ != address(0), "Invalid implementation");
        require(newImplementation_ != implementation[proxy_], "Same implementation");
        
        uint256 currentVersion = versionHistory[proxy_].length;
        implementation[proxy_] = newImplementation_;
        
        // 在UUPS模式下，通过代理调用upgradeToAndCall进行实际升级
        (bool success, ) = proxy_.call(abi.encodeWithSignature("upgradeToAndCall(address,bytes)", newImplementation_, ""));
        require(success, "Upgrade failed");
        
        versionHistory[proxy_].push(VersionInfo({
            implementation: newImplementation_,
            version: currentVersion + 1,
            timestamp: block.timestamp,
            upgradedBy: msg.sender
        }));
        
        emit Upgraded(proxy_, newImplementation_, currentVersion + 1);
    }
    
    /**
     * @dev 获取代理合约数量
     * @return 代理合约数量
     */
    function getProxyCount() external view returns (uint256) {
        return proxyAddresses.length;
    }
    
    /**
     * @dev 获取版本历史
     * @param proxy_ 代理合约地址
     * @return 版本历史数组
     */
    function getVersionHistory(address proxy_) external view returns (VersionInfo[] memory) {
        return versionHistory[proxy_];
    }
    
    /**
     * @dev 获取当前版本
     * @param proxy_ 代理合约地址
     * @return 当前版本号
     */
    function getCurrentVersion(address proxy_) external view returns (uint256) {
        return versionHistory[proxy_].length;
    }
}