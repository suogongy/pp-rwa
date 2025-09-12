// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Script, console } from "forge-std/Script.sol";
import { RWAOracle } from "../src/RWAOracle.sol";

/**
 * @title TestOracleOwner
 * @dev Test oracle contract owner and basic functionality
 */
contract TestOracleOwner is Script {
    function run() external {
        address oracleAddress = vm.envAddress("ORACLE_ADDRESS");
        
        console.log("=== Oracle Contract Owner Test ===");
        console.log("Contract Address:", oracleAddress);
        
        RWAOracle oracle = RWAOracle(payable(oracleAddress));
        
        // 检查所有者
        address owner = oracle.owner();
        console.log("Contract Owner:", owner);
        
        // 检查当前地址
        address currentAddress = vm.addr(vm.envUint("PRIVATE_KEY"));
        console.log("Current Address:", currentAddress);
        
        // 检查权限
        bool isOwner = (owner == currentAddress);
        console.log("Is Owner:", isOwner);
        
        if (isOwner) {
            console.log("Current address is contract owner, can execute initialization");
            
            // 开始广播
            vm.startBroadcast();
            
            // 测试添加价格喂送
            try oracle.addPriceFeed("ETH", address(0), 8) {
                console.log("Successfully added ETH price feed");
                
                // 测试设置价格
                try oracle.updatePrice("ETH", 350000000000) {
                    console.log("Successfully set ETH price to $3500.00");
                    
                    // 读取价格验证
                    int256 price = oracle.getPrice("ETH");
                    console.log("Verify ETH price:", price);
                    
                } catch {
                    console.log("Failed to set price");
                }
                
            } catch {
                console.log("Failed to add price feed");
            }
            
            vm.stopBroadcast();
            
        } else {
            console.log("Current address is not contract owner, cannot execute initialization");
            console.log("Please use contract owner address:", owner);
        }
        
        console.log("=== Test Complete ===");
    }
}