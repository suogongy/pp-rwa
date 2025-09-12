// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title CounterV1
 * @dev 简单的计数器合约，V1版本实现加1逻辑
 */
contract CounterV1 is Initializable, UUPSUpgradeable {
    uint256 public count;
    address public owner;

    event CountUpdated(uint256 newCount);
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
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @dev 获取当前计数器值
     * @return 当前计数器值
     */
    function getCount() public view returns (uint256) {
        return count;
    }

    /**
     * @dev 增加计数器值（加1）
     */
    function next() public {
        count += 1;
        emit CountUpdated(count);
    }

    /**
     * @dev UUPS升级权限控制
     * @param newImplementation 新实现地址
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}