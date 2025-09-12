// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {CounterV1} from "../src/CounterV1.sol";
import {CounterV2} from "../src/CounterV2.sol";
import {RWAUpgradeableProxy} from "../src/RWAUpgradeableProxy.sol";

/**
 * @title BasicUpgradeTest
 * @dev 基础的可升级代理测试
 * 专注于验证基本的升级流程和状态保持
 */
contract BasicUpgradeTest is Test {
    function test_BasicUpgradeFlow() public {
        // 1. Deploy contracts
        RWAUpgradeableProxy proxyManager = new RWAUpgradeableProxy();
        CounterV1 counterV1 = new CounterV1();
        CounterV2 counterV2 = new CounterV2();
        
        // 2. Create proxy with CounterV1
        bytes memory initData = abi.encodeWithSelector(CounterV1.initialize.selector);
        address proxyAddress = proxyManager.createProxy(address(counterV1), initData);
        
        // 3. Test V1 functionality
        CounterV1 proxy = CounterV1(proxyAddress);
        
        // Test initial state
        assertEq(proxy.getCount(), 0, "Initial count should be 0");
        
        // Test V1 next (adds 1)
        proxy.next();
        assertEq(proxy.getCount(), 1, "V1 next should add 1");
        
        proxy.next();
        assertEq(proxy.getCount(), 2, "V1 next should add 1");
        
        uint256 countBeforeUpgrade = proxy.getCount();
        
        // 4. Upgrade to V2
        proxyManager.upgrade(proxyAddress, address(counterV2));
        
        // Verify upgrade record
        assertEq(proxyManager.getCurrentVersion(proxyAddress), 2, "Version should be 2 after upgrade");
        
        // 5. Test V2 functionality
        CounterV2 proxyV2 = CounterV2(proxyAddress);
        proxyV2.initializeV2();
        
        // Verify state persistence
        assertEq(proxyV2.getCount(), countBeforeUpgrade, "Count should be preserved after upgrade");
        assertEq(proxyV2.getV2Prop(), 1, "v2Prop should be initialized to 1");
        
        // Test V2 next (adds 2)
        proxyV2.next();
        assertEq(proxyV2.getCount(), countBeforeUpgrade + 2, "V2 next should add 2");
        
        // Test V2 multi method
        proxyV2.multi(3);
        assertEq(proxyV2.getV2Prop(), 3, "multi(3) should multiply v2Prop by 3");
        
        // Verify state independence
        uint256 countBeforeMulti = proxyV2.getCount();
        proxyV2.multi(2);
        assertEq(proxyV2.getCount(), countBeforeMulti, "multi should not affect count");
        assertEq(proxyV2.getV2Prop(), 6, "multi should update v2Prop correctly");
        
        console.log("SUCCESS: Basic upgrade flow completed successfully!");
    }
    
    function test_UpgradeWithoutInitializeV2() public {
        // Test that upgrade works even without calling initializeV2
        RWAUpgradeableProxy proxyManager = new RWAUpgradeableProxy();
        CounterV1 counterV1 = new CounterV1();
        CounterV2 counterV2 = new CounterV2();
        
        address proxyAddress = proxyManager.createProxy(address(counterV1), abi.encodeWithSelector(CounterV1.initialize.selector));
        
        CounterV1 proxyV1 = CounterV1(proxyAddress);
        proxyV1.next(); // count = 1
        
        uint256 countBeforeUpgrade = proxyV1.getCount();
        
        // Upgrade without calling initializeV2
        proxyManager.upgrade(proxyAddress, address(counterV2));
        
        CounterV2 proxyV2 = CounterV2(proxyAddress);
        
        // State should be preserved
        assertEq(proxyV2.getCount(), countBeforeUpgrade, "Count should be preserved");
        
        // V2 functionality should work (v2Prop will have default value 0)
        proxyV2.next(); // adds 2
        assertEq(proxyV2.getCount(), countBeforeUpgrade + 2, "V2 next should work");
        
        console.log("SUCCESS: Upgrade without initializeV2 works!");
    }
}