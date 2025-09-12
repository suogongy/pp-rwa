// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title CounterV2
 * @dev 计数器合约V2版本，实现加2逻辑和v2Prop属性
 */
contract CounterV2 is Initializable, UUPSUpgradeable {
    uint256 public count;
    address public owner;
    uint256 public v2Prop;

    event CountUpdated(uint256 newCount);
    event V2PropUpdated(uint256 newValue);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    /**
     * @dev 初始化函数
     */
    function initialize() public initializer {
        owner = msg.sender;
        count = 0;
        v2Prop = 1;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @dev 升级后初始化函数，用于设置新增的状态变量
     */
    function initializeV2() public reinitializer(2) {
        v2Prop = 1;
    }

    /**
     * @dev 获取当前计数器值
     * @return 当前计数器值
     */
    function getCount() public view returns (uint256) {
        return count;
    }

    /**
     * @dev 获取v2Prop值
     * @return v2Prop当前值
     */
    function getV2Prop() public view returns (uint256) {
        return v2Prop;
    }

    /**
     * @dev 增加计数器值（加2）
     */
    function next() public {
        count += 2;
        emit CountUpdated(count);
    }

    /**
     * @dev 根据入参更新v2Prop的值，实现倍乘效果
     * @param multiplier 乘数
     */
    function multi(uint256 multiplier) public {
        require(multiplier > 0, "Multiplier must be greater than 0");
        v2Prop = v2Prop * multiplier;
        emit V2PropUpdated(v2Prop);
    }

    /**
     * @dev UUPS升级权限控制
     * @param newImplementation 新实现地址
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}