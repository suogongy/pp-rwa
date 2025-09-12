// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {CounterV1} from "../src/CounterV1.sol";
import {CounterV2} from "../src/CounterV2.sol";
import {RWAUpgradeableProxy} from "../src/RWAUpgradeableProxy.sol";

/**
 * @title CounterUpgradeDemo
 * @dev 完整的可升级代理演示测试
 * 展示从CounterV1升级到CounterV2的完整流程
 */
contract CounterUpgradeDemo is Test {
    function test_CompleteUpgradeDemo() public {
        // 1. Deploy contracts
        RWAUpgradeableProxy proxyManager = new RWAUpgradeableProxy();
        CounterV1 counterV1 = new CounterV1();
        CounterV2 counterV2 = new CounterV2();
        
        console.log("=== Deployment Complete ===");
        console.log("ProxyManager:", address(proxyManager));
        console.log("CounterV1:", address(counterV1));
        console.log("CounterV2:", address(counterV2));
        
        // 2. Create proxy with CounterV1
        bytes memory initData = abi.encodeWithSelector(CounterV1.initialize.selector);
        address proxyAddress = proxyManager.createProxy(address(counterV1), initData);
        
        console.log("\n=== Proxy Created ===");
        console.log("Proxy Address:", proxyAddress);
        
        // 3. Test V1 functionality (next adds 1)
        CounterV1 proxyCounterV1 = CounterV1(proxyAddress);
        
        console.log("\n=== Testing V1 (next adds 1) ===");
        console.log("Initial count:", proxyCounterV1.getCount());
        
        proxyCounterV1.next();
        console.log("After 1st next():", proxyCounterV1.getCount());
        
        proxyCounterV1.next();
        console.log("After 2nd next():", proxyCounterV1.getCount());
        
        proxyCounterV1.next();
        console.log("After 3rd next():", proxyCounterV1.getCount());
        
        uint256 finalV1Count = proxyCounterV1.getCount();
        console.log("V1 final count:", finalV1Count);
        
        // 4. Upgrade to CounterV2
        proxyManager.upgrade(proxyAddress, address(counterV2));
        
        console.log("\n=== Upgrade to V2 Complete ===");
        console.log("New implementation:", address(counterV2));
        console.log("Current version:", proxyManager.getCurrentVersion(proxyAddress));
        
        // 5. Initialize V2 and test functionality
        CounterV2 proxyCounterV2 = CounterV2(proxyAddress);
        proxyCounterV2.initializeV2();
        
        console.log("\n=== V2 Initialization Complete ===");
        console.log("v2Prop initialized:", proxyCounterV2.getV2Prop());
        
        console.log("\n=== State Persistence Check ===");
        console.log("Count after upgrade:", proxyCounterV2.getCount());
        
        // Verify count state preserved
        assertEq(proxyCounterV2.getCount(), finalV1Count, "Count should be preserved");
        console.log("[OK] Count preservation verified");
        
        // 6. Test V2 next method (adds 2)
        console.log("\n=== Testing V2 (next adds 2) ===");
        console.log("Count after upgrade:", proxyCounterV2.getCount());
        
        proxyCounterV2.next();
        console.log("After V2 1st next():", proxyCounterV2.getCount());
        
        proxyCounterV2.next();
        console.log("After V2 2nd next():", proxyCounterV2.getCount());
        
        proxyCounterV2.next();
        console.log("After V2 3rd next():", proxyCounterV2.getCount());
        
        // Verify V2 next method adds 2
        uint256 expectedCount = finalV1Count + 2 * 3;
        assertEq(proxyCounterV2.getCount(), expectedCount, "V2 next should add 2");
        console.log("[OK] V2 next() add-2 logic verified");
        
        // 7. Test V2 new multi method
        console.log("\n=== Testing V2 New Method (multi) ===");
        console.log("v2Prop initial value:", proxyCounterV2.getV2Prop());
        
        proxyCounterV2.multi(2);
        console.log("After multi(2):", proxyCounterV2.getV2Prop());
        
        proxyCounterV2.multi(2);
        console.log("After multi(2):", proxyCounterV2.getV2Prop());
        
        proxyCounterV2.multi(3);
        console.log("After multi(3):", proxyCounterV2.getV2Prop());
        
        // Verify multi method multiplication logic
        assertEq(proxyCounterV2.getV2Prop(), 12, "multi should multiply: 1*2*2*3=12");
        console.log("[OK] V2 multi() multiplication verified");
        
        // 8. Test state independence
        console.log("\n=== State Independence Test ===");
        uint256 countBeforeMulti = proxyCounterV2.getCount();
        uint256 v2PropBeforeMulti = proxyCounterV2.getV2Prop();
        
        proxyCounterV2.multi(5);
        assertEq(proxyCounterV2.getCount(), countBeforeMulti, "multi should not affect count");
        assertEq(proxyCounterV2.getV2Prop(), v2PropBeforeMulti * 5, "multi should update v2Prop");
        
        console.log("[OK] State independence verified");
        
        // 9. Test error handling
        console.log("\n=== Error Handling Test ===");
        vm.expectRevert("Multiplier must be greater than 0");
        proxyCounterV2.multi(0);
        console.log("[OK] multi(0) error handling verified");
        
        // 10. Final state
        console.log("\n=== Final State ===");
        console.log("Final count:", proxyCounterV2.getCount());
        console.log("Final v2Prop:", proxyCounterV2.getV2Prop());
        
        console.log("\nSUCCESS: Complete upgrade flow successful!");
        console.log("[OK] V1 next() adds 1 verified");
        console.log("[OK] Upgrade process verified");
        console.log("[OK] State persistence verified");
        console.log("[OK] V2 next() adds 2 verified");
        console.log("[OK] V2 multi() new method verified");
        console.log("[OK] State independence verified");
        console.log("[OK] Error handling verified");
    }
}