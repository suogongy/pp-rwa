// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/RWAOracle.sol";

contract RWAOracleTest is Test {
    RWAOracle public oracle;
    address public owner = address(1);
    address public user1 = address(2);
    
    function setUp() public {
        vm.prank(owner);
        oracle = new RWAOracle();
    }
    
    function testInitialization() public {
        assertEq(oracle.owner(), owner);
        assertEq(oracle.getPriceFeedCount(), 0);
        assertEq(oracle.getAssetValuationCount(), 0);
        assertEq(oracle.randomRequestCount(), 0);
    }
    
    function testAddPriceFeed() public {
        vm.prank(owner);
        oracle.addPriceFeed("ETH", address(0x1234), 18);
        
        assertEq(oracle.getPriceFeedCount(), 1);
    }
    
    function testUpdatePrice() public {
        vm.prank(owner);
        oracle.addPriceFeed("ETH", address(0x1234), 18);
        
        vm.prank(owner);
        oracle.updatePrice("ETH", 2000 * 10**18);
        
        // Note: getPrice function is not implemented in the current contract
        // We'll need to add it or modify the test
    }
    
    function testRequestAssetValuation() public {
        vm.prank(owner);
        oracle.addPriceFeed("ETH", address(0x1234), 18);
        
        vm.prank(owner);
        oracle.updatePrice("ETH", 2000 * 10**18);
        
        vm.prank(user1);
        oracle.requestAssetValuation(1, "ETH");
        
        assertEq(oracle.getAssetValuationCount(), 1);
    }
    
    function testRequestRandomNumber() public {
        vm.prank(user1);
        uint256 requestId = oracle.requestRandomNumber(12345);
        
        assertEq(requestId, 1);
        assertEq(oracle.randomRequestCount(), 1);
    }
    
    function testRandomNumberGeneration() public {
        vm.prank(user1);
        uint256 requestId = oracle.requestRandomNumber(12345);
        
        uint256[] memory result = oracle.getRandomNumber(requestId);
        assertEq(result.length, 1);
        assertGt(result[0], 0);
    }
    
    function testOnlyOwnerFunctions() public {
        vm.prank(user1);
        vm.expectRevert();
        oracle.addPriceFeed("ETH", address(0x1234), 18);
        
        vm.prank(user1);
        vm.expectRevert();
        oracle.updatePrice("ETH", 2000 * 10**18);
    }
}