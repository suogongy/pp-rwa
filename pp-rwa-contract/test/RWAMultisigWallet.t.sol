// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/RWAMultisigWallet.sol";

contract RWAMultisigWalletTest is Test {
    RWAMultisigWallet public wallet;
    
    address public owner = address(1);
    address public signer1 = address(2);
    address public signer2 = address(3);
    address public signer3 = address(4);
    address public nonSigner = address(5);
    address public recipient = address(6);
    
    function setUp() public {
        address[] memory initialSigners = new address[](3);
        initialSigners[0] = signer1;
        initialSigners[1] = signer2;
        initialSigners[2] = signer3;
        
        uint256 initialThreshold = 2;
        
        vm.prank(owner);
        wallet = new RWAMultisigWallet(initialSigners, initialThreshold);
    }
    
    function testInitialization() public {
        assertEq(wallet.owner(), owner);
        assertEq(wallet.signatureThreshold(), 2);
        assertEq(wallet.signerCount(), 3);
        assertTrue(wallet.isSigner(signer1));
        assertTrue(wallet.isSigner(signer2));
        assertTrue(wallet.isSigner(signer3));
        assertFalse(wallet.isSigner(nonSigner));
    }
    
    function testCreateEtherTransaction() public {
        vm.startPrank(signer1);
        
        uint256 transactionId = wallet.createEtherTransaction(
            recipient,
            1 ether,
            block.timestamp + 1 days
        );
        
        assertEq(transactionId, 1);
        
        RWAMultisigWallet.Transaction memory transaction = wallet.getTransaction(transactionId);
        assertEq(transaction.id, 1);
        assertEq(uint256(transaction.transactionType), uint256(RWAMultisigWallet.TransactionType.ETHER_TRANSFER));
        assertEq(transaction.destination, recipient);
        assertEq(transaction.value, 1 ether);
        assertEq(uint256(transaction.status), uint256(RWAMultisigWallet.TransactionStatus.PENDING));
        
        vm.stopPrank();
    }
    
    function testCreateEtherTransactionNotSigner() public {
        vm.startPrank(nonSigner);
        
        vm.expectRevert("Multisig: not active signer");
        wallet.createEtherTransaction(
            recipient,
            1 ether,
            block.timestamp + 1 days
        );
        
        vm.stopPrank();
    }
    
    function testSignTransaction() public {
        // 创建交易
        vm.startPrank(signer1);
        uint256 transactionId = wallet.createEtherTransaction(
            recipient,
            1 ether,
            block.timestamp + 1 days
        );
        vm.stopPrank();
        
        // 签名交易
        vm.startPrank(signer2);
        wallet.signTransaction(transactionId, "0x1234567890abcdef");
        vm.stopPrank();
        
        // 检查签名
        assertTrue(wallet.signatures(transactionId, signer2));
        assertEq(wallet.signatureCount(transactionId), 1);
    }
    
    function testSignTransactionNotSigner() public {
        // 创建交易
        vm.startPrank(signer1);
        uint256 transactionId = wallet.createEtherTransaction(
            recipient,
            1 ether,
            block.timestamp + 1 days
        );
        vm.stopPrank();
        
        // 非签名者尝试签名
        vm.startPrank(nonSigner);
        vm.expectRevert("Multisig: not active signer");
        wallet.signTransaction(transactionId, "0x1234567890abcdef");
        vm.stopPrank();
    }
    
    function testSignTransactionAlreadySigned() public {
        // 创建交易
        vm.startPrank(signer1);
        uint256 transactionId = wallet.createEtherTransaction(
            recipient,
            1 ether,
            block.timestamp + 1 days
        );
        vm.stopPrank();
        
        // 第一次签名
        vm.startPrank(signer2);
        wallet.signTransaction(transactionId, "0x1234567890abcdef");
        vm.stopPrank();
        
        // 第二次签名（应该失败）
        vm.startPrank(signer2);
        vm.expectRevert("Multisig: already signed");
        wallet.signTransaction(transactionId, "0x1234567890abcdef");
        vm.stopPrank();
    }
    
    function testExecuteTransaction() public {
        // 创建交易
        vm.startPrank(signer1);
        uint256 transactionId = wallet.createEtherTransaction(
            recipient,
            1 ether,
            block.timestamp + 1 days
        );
        vm.stopPrank();
        
        // 存入ETH
        vm.deal(address(wallet), 2 ether);
        
        // 签名交易
        vm.startPrank(signer2);
        wallet.signTransaction(transactionId, "0x1234567890abcdef");
        vm.stopPrank();
        
        vm.startPrank(signer3);
        wallet.signTransaction(transactionId, "0x1234567890abcdef");
        vm.stopPrank();
        
        // 执行交易
        vm.startPrank(signer1);
        wallet.executeTransaction(transactionId);
        vm.stopPrank();
        
        // 检查执行结果
        RWAMultisigWallet.Transaction memory transaction = wallet.getTransaction(transactionId);
        assertEq(uint256(transaction.status), uint256(RWAMultisigWallet.TransactionStatus.EXECUTED));
        assertEq(recipient.balance, 1 ether);
    }
    
    function testExecuteTransactionNotEnoughSignatures() public {
        // 创建交易
        vm.startPrank(signer1);
        uint256 transactionId = wallet.createEtherTransaction(
            recipient,
            1 ether,
            block.timestamp + 1 days
        );
        vm.stopPrank();
        
        // 只有一个签名
        vm.startPrank(signer2);
        wallet.signTransaction(transactionId, "0x1234567890abcdef");
        vm.stopPrank();
        
        // 尝试执行（应该失败）
        vm.startPrank(signer1);
        vm.expectRevert("Multisig: insufficient signatures");
        wallet.executeTransaction(transactionId);
        vm.stopPrank();
    }
    
    function testCancelTransaction() public {
        // 创建交易
        vm.startPrank(signer1);
        uint256 transactionId = wallet.createEtherTransaction(
            recipient,
            1 ether,
            block.timestamp + 1 days
        );
        vm.stopPrank();
        
        // 签名交易
        vm.startPrank(signer2);
        wallet.signTransaction(transactionId, "0x1234567890abcdef");
        vm.stopPrank();
        
        // 取消交易
        vm.startPrank(signer2);
        wallet.cancelTransaction(transactionId);
        vm.stopPrank();
        
        // 检查取消结果
        RWAMultisigWallet.Transaction memory transaction = wallet.getTransaction(transactionId);
        assertEq(uint256(transaction.status), uint256(RWAMultisigWallet.TransactionStatus.CANCELLED));
    }
    
    function testCancelTransactionNotSigner() public {
        // 创建交易
        vm.startPrank(signer1);
        uint256 transactionId = wallet.createEtherTransaction(
            recipient,
            1 ether,
            block.timestamp + 1 days
        );
        vm.stopPrank();
        
        // 非签名者尝试取消
        vm.startPrank(nonSigner);
        vm.expectRevert("Multisig: must be signer");
        wallet.cancelTransaction(transactionId);
        vm.stopPrank();
    }
    
    function testAddSigner() public {
        vm.startPrank(owner);
        wallet.addSigner(nonSigner);
        vm.stopPrank();
        
        assertTrue(wallet.isSigner(nonSigner));
        assertEq(wallet.signerCount(), 4);
    }
    
    function testAddSignerNotOwner() public {
        vm.startPrank(signer1);
        vm.expectRevert("Ownable: caller is not the owner");
        wallet.addSigner(nonSigner);
        vm.stopPrank();
    }
    
    function testRemoveSigner() public {
        vm.startPrank(owner);
        wallet.removeSigner(signer3);
        vm.stopPrank();
        
        assertFalse(wallet.isSigner(signer3));
        assertEq(wallet.signerCount(), 2);
    }
    
    function testRemoveSignerLastSigner() public {
        vm.startPrank(owner);
        vm.expectRevert("Multisig: cannot remove last signer");
        wallet.removeSigner(signer1);
        vm.stopPrank();
    }
    
    function testSetSignatureThreshold() public {
        vm.startPrank(owner);
        wallet.setSignatureThreshold(3);
        vm.stopPrank();
        
        assertEq(wallet.signatureThreshold(), 3);
    }
    
    function testSetSignatureThresholdInvalid() public {
        vm.startPrank(owner);
        vm.expectRevert("Multisig: invalid threshold");
        wallet.setSignatureThreshold(0);
        vm.stopPrank();
    }
    
    function testEmergencyPause() public {
        vm.startPrank(owner);
        wallet.emergencyPause();
        vm.stopPrank();
        
        assertTrue(wallet.emergencyPaused());
    }
    
    function testEmergencyPauseNotOwner() public {
        vm.startPrank(signer1);
        vm.expectRevert("Ownable: caller is not the owner");
        wallet.emergencyPause();
        vm.stopPrank();
    }
    
    function testCreateTransactionWhenPaused() public {
        vm.startPrank(owner);
        wallet.emergencyPause();
        vm.stopPrank();
        
        vm.startPrank(signer1);
        vm.expectRevert("Multisig: emergency paused");
        wallet.createEtherTransaction(
            recipient,
            1 ether,
            block.timestamp + 1 days
        );
        vm.stopPrank();
    }
    
    function testReceiveEther() public {
        vm.deal(address(wallet), 1 ether);
        assertEq(address(wallet).balance, 1 ether);
    }
}