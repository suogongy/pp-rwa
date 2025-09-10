// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RWA20.sol";

contract RWA20Test is Test {
    RWA20 public rwa20;
    address public owner;
    address public user1;
    address public user2;

    // 事件定义
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TokensMinted(address indexed to, uint256 amount, bytes32 indexed txId);
    event TokensBurned(address indexed from, uint256 amount, bytes32 indexed txId);
    event WhitelistUpdated(address indexed account, bool status);
    event Paused(address account);

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        // 部署合约
        rwa20 = new RWA20("Real World Asset Token", "RWA", owner);

        // 给测试用户一些初始资金
        deal(user1, 1 ether);
        deal(user2, 1 ether);
    }

    // 测试基础信息
    function testInitialState() public {
        assertEq(rwa20.name(), "Real World Asset Token");
        assertEq(rwa20.symbol(), "RWA");
        assertEq(rwa20.decimals(), 18);
        assertEq(rwa20.owner(), owner);
        assertEq(rwa20.paused(), false);
        assertEq(rwa20.totalSupply(), 1000000 * 1e18);
        assertEq(rwa20.balanceOf(owner), 1000000 * 1e18);
    }

    // 测试转账功能
    function testTransfer() public {
        uint256 transferAmount = 1000 * 1e18;

        // Owner转账给user1
        vm.prank(owner);
        bool success = rwa20.transfer(user1, transferAmount);

        assertTrue(success);
        assertEq(rwa20.balanceOf(owner), 1000000 * 1e18 - transferAmount);
        assertEq(rwa20.balanceOf(user1), transferAmount);
    }

    // 测试转账失败情况
    function testTransferFailInsufficientBalance() public {
        uint256 transferAmount = 2000000 * 1e18; // 超过余额

        vm.prank(user1);
        vm.expectRevert();
        rwa20.transfer(user2, transferAmount);
    }

    // 测试转账到零地址
    function testTransferFailToZeroAddress() public {
        uint256 transferAmount = 1000 * 1e18;

        vm.prank(owner);
        vm.expectRevert();
        rwa20.transfer(address(0), transferAmount);
    }

    // 测试授权功能
    function testApprove() public {
        uint256 approveAmount = 1000 * 1e18;

        vm.prank(owner);
        bool success = rwa20.approve(user1, approveAmount);

        assertTrue(success);
        assertEq(rwa20.allowance(owner, user1), approveAmount);
    }

    // 测试transferFrom功能
    function testTransferFrom() public {
        uint256 approveAmount = 1000 * 1e18;
        uint256 transferAmount = 500 * 1e18;

        // Owner授权给user1
        vm.prank(owner);
        rwa20.approve(user1, approveAmount);

        // user1从owner转账给user2
        vm.prank(user1);
        bool success = rwa20.transferFrom(owner, user2, transferAmount);

        assertTrue(success);
        assertEq(rwa20.balanceOf(owner), 1000000 * 1e18 - transferAmount);
        assertEq(rwa20.balanceOf(user2), transferAmount);
        assertEq(rwa20.allowance(owner, user1), approveAmount - transferAmount);
    }

    // 测试铸造功能
    function testMint() public {
        uint256 mintAmount = 1000 * 1e18;
        uint256 initialSupply = rwa20.totalSupply();

        vm.prank(owner);
        rwa20.mint(user1, mintAmount);

        assertEq(rwa20.totalSupply(), initialSupply + mintAmount);
        assertEq(rwa20.balanceOf(user1), mintAmount);
    }

    // 测试非所有者铸造失败
    function testMintFailNotOwner() public {
        uint256 mintAmount = 1000 * 1e18;

        vm.prank(user1);
        vm.expectRevert();
        rwa20.mint(user2, mintAmount);
    }

    // 测试铸造到零地址失败
    function testMintFailToZeroAddress() public {
        uint256 mintAmount = 1000 * 1e18;

        vm.prank(owner);
        vm.expectRevert("RWA20: mint to the zero address");
        rwa20.mint(address(0), mintAmount);
    }

    // 测试铸造零金额失败
    function testMintFailZeroAmount() public {
        uint256 mintAmount = 0;

        vm.prank(owner);
        vm.expectRevert("RWA20: mint amount must be positive");
        rwa20.mint(user1, mintAmount);
    }

    // 测试销毁功能
    function testBurn() public {
        uint256 burnAmount = 1000 * 1e18;
        uint256 initialSupply = rwa20.totalSupply();

        vm.prank(owner);
        rwa20.burn(burnAmount);

        assertEq(rwa20.totalSupply(), initialSupply - burnAmount);
        assertEq(rwa20.balanceOf(owner), 1000000 * 1e18 - burnAmount);
    }

    // 测试暂停功能
    function testPause() public {
        vm.prank(owner);
        rwa20.pause();

        assertTrue(rwa20.paused());

        // 暂停后转账应该失败
        vm.prank(owner);
        vm.expectRevert();
        rwa20.transfer(user1, 1000 * 1e18);
    }

    // 测试恢复功能
    function testUnpause() public {
        // 先暂停
        vm.prank(owner);
        rwa20.pause();

        assertTrue(rwa20.paused());

        // 再恢复
        vm.prank(owner);
        rwa20.unpause();

        assertFalse(rwa20.paused());

        // 恢复后转账应该成功
        vm.prank(owner);
        bool success = rwa20.transfer(user1, 1000 * 1e18);
        assertTrue(success);
    }

    // 测试非所有者暂停失败
    function testPauseFailNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        rwa20.pause();
    }

    // 测试白名单功能
    function testWhitelist() public {
        vm.prank(owner);
        rwa20.addToWhitelist(user1);

        assertTrue(rwa20.isWhitelisted(user1));

        vm.prank(owner);
        rwa20.removeFromWhitelist(user1);

        assertFalse(rwa20.isWhitelisted(user1));
    }

    // 测试批量转账功能
    function testBatchTransfer() public {
        address[] memory recipients = new address[](2);
        recipients[0] = user1;
        recipients[1] = user2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000 * 1e18;
        amounts[1] = 2000 * 1e18;

        uint256 totalAmount = 3000 * 1e18;
        uint256 initialBalance = rwa20.balanceOf(owner);

        vm.prank(owner);
        rwa20.batchTransfer(recipients, amounts);

        assertEq(rwa20.balanceOf(owner), initialBalance - totalAmount);
        assertEq(rwa20.balanceOf(user1), amounts[0]);
        assertEq(rwa20.balanceOf(user2), amounts[1]);
    }

    // 测试批量转账失败 - 数组长度不匹配
    function testBatchTransferFailArrayLengthMismatch() public {
        address[] memory recipients = new address[](2);
        recipients[0] = user1;
        recipients[1] = user2;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1000 * 1e18;

        vm.prank(owner);
        vm.expectRevert("RWA20: arrays length mismatch");
        rwa20.batchTransfer(recipients, amounts);
    }

    // 测试批量转账失败 - 批量大小过大
    function testBatchTransferFailBatchSizeTooLarge() public {
        address[] memory recipients = new address[](101);
        uint256[] memory amounts = new uint256[](101);

        for (uint256 i = 0; i < 101; i++) {
            recipients[i] = address(uint160(i + 1));
            amounts[i] = 1000 * 1e18;
        }

        vm.prank(owner);
        vm.expectRevert("RWA20: batch size too large");
        rwa20.batchTransfer(recipients, amounts);
    }

    // 测试批量转账失败 - 余额不足
    function testBatchTransferFailInsufficientBalance() public {
        address[] memory recipients = new address[](2);
        recipients[0] = user1;
        recipients[1] = user2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1000000 * 1e18;
        amounts[1] = 1000000 * 1e18;

        vm.prank(owner);
        vm.expectRevert("RWA20: insufficient balance");
        rwa20.batchTransfer(recipients, amounts);
    }

    // 注释：OpenZeppelin v5移除了increaseAllowance和decreaseAllowance函数
    // 因为它们不是ERC20标准的一部分。现在只能使用标准的approve函数。

    // 测试转移所有权
    function testTransferOwnership() public {
        vm.prank(owner);
        rwa20.transferOwnership(user1);

        assertEq(rwa20.owner(), user1);

        // 新所有者应该能够铸造代币
        vm.prank(user1);
        rwa20.mint(user2, 1000 * 1e18);

        assertEq(rwa20.balanceOf(user2), 1000 * 1e18);
    }

    // 测试转移所有权到零地址失败
    function testTransferOwnershipFailToZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert();
        rwa20.transferOwnership(address(0));
    }

    // 测试事件触发
    function testEvents() public {
        uint256 testAmount = 1000 * 1e18;

        // 测试Transfer事件
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Transfer(owner, user1, testAmount);
        rwa20.transfer(user1, testAmount);

        // 测试Approval事件
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Approval(owner, user1, testAmount);
        rwa20.approve(user1, testAmount);

        // 测试TokensMinted事件
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit TokensMinted(
            user1,
            testAmount,
            keccak256(abi.encodePacked(block.timestamp, user1, testAmount, blockhash(block.number - 1), msg.sender))
        );
        rwa20.mint(user1, testAmount);

        // 测试WhitelistUpdated事件
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit WhitelistUpdated(user1, true);
        rwa20.addToWhitelist(user1);

        // 测试Pause事件 (OpenZeppelin使用Paused事件)
        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit Paused(owner);
        rwa20.pause();
    }

    // 测试Gas使用情况
    function testGasUsage() public {
        uint256 initialGas = gasleft();

        // 测试转账Gas使用
        vm.prank(owner);
        rwa20.transfer(user1, 1000 * 1e18);

        uint256 transferGas = initialGas - gasleft();
        emit log_named_uint("Transfer Gas", transferGas);

        // 测试批量转账Gas使用
        address[] memory recipients = new address[](3);
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = address(0x3);

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 1000 * 1e18;
        amounts[1] = 2000 * 1e18;
        amounts[2] = 3000 * 1e18;

        initialGas = gasleft();
        vm.prank(owner);
        rwa20.batchTransfer(recipients, amounts);

        uint256 batchTransferGas = initialGas - gasleft();
        emit log_named_uint("Batch Transfer Gas", batchTransferGas);

        // 测试铸造Gas使用
        initialGas = gasleft();
        vm.prank(owner);
        rwa20.mint(user1, 1000 * 1e18);

        uint256 mintGas = initialGas - gasleft();
        emit log_named_uint("Mint Gas", mintGas);
    }
}
