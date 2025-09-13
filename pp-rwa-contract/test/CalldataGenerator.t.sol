// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/RWAOracle.sol";

/**
 * @title CalldataGenerator
 * @dev 测试工具合约，用于生成特定方法的calldata
 * 默认实现为输出 RWAOracle 合约的 requestRandomNumber 方法的 calldata
 */
contract CalldataGenerator is Test {
    
    /**
     * @dev 生成 RWAOracle 合约 requestRandomNumber 方法的 calldata
     * @param seed 随机数种子
     * @return encodedCalldata 编码后的 calldata
     */
    function generateRequestRandomNumberCalldata(uint256 seed) public pure returns (bytes memory) {
        bytes memory encodedCalldata = abi.encodeWithSignature("requestRandomNumber(uint256)", seed);
        console.log("Generated calldata for requestRandomNumber(%d):", seed);
        console.logBytes(encodedCalldata);
        return encodedCalldata;
    }
    
    /**
     * @dev 生成 RWAOracle 合约 requestRandomNumber 方法的 calldata 并返回详细信息
     * @param seed 随机数种子
     */
    function generateAndLogRequestRandomNumberCalldata(uint256 seed) public pure {
        bytes4 functionSelector = bytes4(keccak256("requestRandomNumber(uint256)"));
        bytes memory encodedParams = abi.encode(seed);
        bytes memory encodedCalldata = abi.encodePacked(functionSelector, encodedParams);
        
        console.log("=== Calldata Generation for RWAOracle.requestRandomNumber ===");
        console.log("Function signature: requestRandomNumber(uint256)");
        console.log("Function selector: 0x%s", bytes4ToString(functionSelector));
        console.log("Seed parameter: %d", seed);
        console.log("Encoded parameter: ");
        console.logBytes(encodedParams);
        console.log("Complete calldata: ");
        console.logBytes(encodedCalldata);
        console.log("========================================================");
    }
    
    /**
     * @dev 将 bytes4 转换为字符串表示形式
     * @param data bytes4 数据
     * @return result 字符串表示
     */
    function bytes4ToString(bytes4 data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(8);
        
        for (uint256 i = 0; i < 4; i++) {
            uint8 b = uint8(data[i]);
            str[i*2] = alphabet[b >> 4];
            str[i*2+1] = alphabet[b & 0x0f];
        }
        
        return string(str);
    }
    
    /**
     * @dev 测试方法，验证生成的 calldata 是否正确
     * @param seed 随机数种子
     */
    function testCalldataGeneration(uint256 seed) public view {
        bytes memory generatedCalldata = this.generateRequestRandomNumberCalldata(seed);
        bytes memory expectedCalldata = abi.encodeWithSelector(RWAOracle.requestRandomNumber.selector, seed);
        
        console.log("Testing calldata generation...");
        console.log("Generated calldata length: %d", generatedCalldata.length);
        console.log("Expected calldata length: %d", expectedCalldata.length);
        
        bool isMatch = keccak256(generatedCalldata) == keccak256(expectedCalldata);
        console.log("Calldata match: %s", isMatch ? "true" : "false");
        
        require(isMatch, "Generated calldata does not match expected calldata");
        console.log("Calldata generation test passed!");
    }
    
    /**
     * @dev 示例方法，展示如何使用该工具
     */
    function testUsageExample() public view {
        uint256 seed = 12345;
        
        // 方法1: 直接生成 calldata
        bytes memory calldata1 = generateRequestRandomNumberCalldata(seed);
        console.log("Method 1 - Direct generation:");
        console.logBytes(calldata1);
        
        // 方法2: 生成并记录详细信息
        console.log("\nMethod 2 - Detailed generation:");
        generateAndLogRequestRandomNumberCalldata(seed);
        
        // 方法3: 测试生成的 calldata
        console.log("\nMethod 3 - Testing generation:");
        testCalldataGeneration(seed);
    }
}