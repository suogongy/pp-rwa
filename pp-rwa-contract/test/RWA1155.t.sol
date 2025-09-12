// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/RWA1155.sol";

contract RWA1155Test is Test {
    RWA1155 public rwa1155;
    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public royaltyReceiver = address(4);
    
    function setUp() public {
        vm.prank(owner);
        rwa1155 = new RWA1155("https://api.example.com/token/{id}.json");
    }
    
    function testInitialization() public {
        assertEq(rwa1155.owner(), owner);
        assertEq(rwa1155.uri(0), "https://api.example.com/token/{id}.json");
    }
    
    function testCreateToken() public {
        vm.prank(owner);
        uint256 tokenId = rwa1155.createToken(
            "Test Token",
            "TEST",
            1000,
            true,
            true,
            true,
            ""
        );
        
        assertEq(tokenId, 1);
        assertEq(rwa1155.getTokenCount(), 1);
        
        (string memory name, string memory symbol, uint256 totalSupply, bool isMintable, bool isBurnable, bool isTransferable) = rwa1155.tokenInfos(tokenId);
        assertEq(name, "Test Token");
        assertEq(symbol, "TEST");
        assertEq(totalSupply, 1000);
        assertTrue(isMintable);
        assertTrue(isBurnable);
        assertTrue(isTransferable);
    }
    
    function testCreateTokenWithoutInitialSupply() public {
        vm.prank(owner);
        uint256 tokenId = rwa1155.createToken(
            "Test Token",
            "TEST",
            0,
            true,
            true,
            true,
            ""
        );
        
        assertEq(tokenId, 1);
        assertEq(rwa1155.balanceOf(owner, tokenId), 0);
    }
    
    function testCreateTokenWithInitialSupply() public {
        vm.prank(owner);
        uint256 tokenId = rwa1155.createToken(
            "Test Token",
            "TEST",
            1000,
            true,
            true,
            true,
            ""
        );
        
        assertEq(rwa1155.balanceOf(owner, tokenId), 1000);
        (, , uint256 totalSupply, , , ) = rwa1155.tokenInfos(tokenId);
        assertEq(totalSupply, 1000);
    }
    
    function testCreateTokenNotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        rwa1155.createToken(
            "Test Token",
            "TEST",
            1000,
            true,
            true,
            true,
            ""
        );
    }
    
    function testMint() public {
        vm.prank(owner);
        uint256 tokenId = rwa1155.createToken(
            "Test Token",
            "TEST",
            1000,
            true,
            true,
            true,
            ""
        );
        
        vm.prank(owner);
        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = tokenId;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 500;
        rwa1155.mintBatch(user1, tokenIds, amounts, "");
        
        assertEq(rwa1155.balanceOf(user1, tokenId), 500);
        (, , uint256 totalSupply, , , ) = rwa1155.tokenInfos(tokenId);
        assertEq(totalSupply, 1500);
    }
    
    function testMintNotMintable() public {
        vm.prank(owner);
        uint256 tokenId = rwa1155.createToken(
            "Test Token",
            "TEST",
            1000,
            false,
            true,
            true,
            ""
        );
        
        vm.prank(owner);
        vm.expectRevert("Token not mintable");
        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = tokenId;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 500;
        rwa1155.mintBatch(user1, tokenIds, amounts, "");
    }
    
    function testMintNotOwner() public {
        vm.prank(owner);
        uint256 tokenId = rwa1155.createToken(
            "Test Token",
            "TEST",
            1000,
            true,
            true,
            true,
            ""
        );
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = tokenId;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 500;
        rwa1155.mintBatch(user2, tokenIds, amounts, "");
    }
    
    function testMintBatch() public {
        vm.prank(owner);
        uint256 tokenId1 = rwa1155.createToken(
            "Token 1",
            "TK1",
            1000,
            true,
            true,
            true,
            ""
        );
        
        vm.prank(owner);
        uint256 tokenId2 = rwa1155.createToken(
            "Token 2",
            "TK2",
            2000,
            true,
            true,
            true,
            ""
        );
        
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = tokenId1;
        tokenIds[1] = tokenId2;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 100;
        amounts[1] = 200;
        
        vm.prank(owner);
        rwa1155.mintBatch(user1, tokenIds, amounts, "");
        
        assertEq(rwa1155.balanceOf(user1, tokenId1), 100);
        assertEq(rwa1155.balanceOf(user1, tokenId2), 200);
        (, , uint256 totalSupply1, , , ) = rwa1155.tokenInfos(tokenId1);
        (, , uint256 totalSupply2, , , ) = rwa1155.tokenInfos(tokenId2);
        assertEq(totalSupply1, 1100);
        assertEq(totalSupply2, 2200);
    }
    
    function testTransfer() public {
        vm.prank(owner);
        uint256 tokenId = rwa1155.createToken(
            "Test Token",
            "TEST",
            1000,
            true,
            true,
            true,
            ""
        );
        
        vm.prank(owner);
        rwa1155.safeTransferFrom(owner, user1, tokenId, 300, "");
        
        assertEq(rwa1155.balanceOf(owner, tokenId), 700);
        assertEq(rwa1155.balanceOf(user1, tokenId), 300);
    }
    
    function testTransferNotTransferable() public {
        vm.prank(owner);
        uint256 tokenId = rwa1155.createToken(
            "Test Token",
            "TEST",
            1000,
            true,
            true,
            false,
            ""
        );
        
        vm.prank(owner);
        vm.expectRevert("RWA1155: token is not transferable");
        rwa1155.safeTransferFrom(owner, user1, tokenId, 300, "");
    }
    
    function testBatchTransfer() public {
        vm.prank(owner);
        uint256 tokenId1 = rwa1155.createToken(
            "Token 1",
            "TK1",
            1000,
            true,
            true,
            true,
            ""
        );
        
        vm.prank(owner);
        uint256 tokenId2 = rwa1155.createToken(
            "Token 2",
            "TK2",
            2000,
            true,
            true,
            true,
            ""
        );
        
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = tokenId1;
        tokenIds[1] = tokenId2;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 100;
        amounts[1] = 200;
        
        vm.prank(owner);
        rwa1155.safeBatchTransferFrom(owner, user1, tokenIds, amounts, "");
        
        assertEq(rwa1155.balanceOf(owner, tokenId1), 900);
        assertEq(rwa1155.balanceOf(owner, tokenId2), 1800);
        assertEq(rwa1155.balanceOf(user1, tokenId1), 100);
        assertEq(rwa1155.balanceOf(user1, tokenId2), 200);
    }
    
    function testBurn() public {
        vm.prank(owner);
        uint256 tokenId = rwa1155.createToken(
            "Test Token",
            "TEST",
            1000,
            true,
            true,
            true,
            ""
        );
        
        vm.prank(owner);
        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = tokenId;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 300;
        rwa1155.burnBatch(owner, tokenIds, amounts);
        
        assertEq(rwa1155.balanceOf(owner, tokenId), 700);
        (, , uint256 totalSupply, , , ) = rwa1155.tokenInfos(tokenId);
        assertEq(totalSupply, 700);
    }
    
    function testBurnNotBurnable() public {
        vm.prank(owner);
        uint256 tokenId = rwa1155.createToken(
            "Test Token",
            "TEST",
            1000,
            true,
            false,
            true,
            ""
        );
        
        vm.prank(owner);
        vm.expectRevert("Token not burnable");
        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = tokenId;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 300;
        rwa1155.burnBatch(owner, tokenIds, amounts);
    }
    
    function testBurnBatch() public {
        vm.prank(owner);
        uint256 tokenId1 = rwa1155.createToken(
            "Token 1",
            "TK1",
            1000,
            true,
            true,
            true,
            ""
        );
        
        vm.prank(owner);
        uint256 tokenId2 = rwa1155.createToken(
            "Token 2",
            "TK2",
            2000,
            true,
            true,
            true,
            ""
        );
        
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = tokenId1;
        tokenIds[1] = tokenId2;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 100;
        amounts[1] = 200;
        
        vm.prank(owner);
        rwa1155.burnBatch(owner, tokenIds, amounts);
        
        assertEq(rwa1155.balanceOf(owner, tokenId1), 900);
        assertEq(rwa1155.balanceOf(owner, tokenId2), 1800);
        (, , uint256 totalSupply1, , , ) = rwa1155.tokenInfos(tokenId1);
        (, , uint256 totalSupply2, , , ) = rwa1155.tokenInfos(tokenId2);
        assertEq(totalSupply1, 900);
        assertEq(totalSupply2, 1800);
    }
    
    function testWhitelist() public {
        vm.prank(owner);
        rwa1155.setWhitelist(user1, true);
        
        assertTrue(rwa1155.isWhitelisted(user1));
        
        vm.prank(owner);
        rwa1155.setWhitelist(user1, false);
        
        assertFalse(rwa1155.isWhitelisted(user1));
    }
    
    function testTokenWhitelist() public {
        vm.prank(owner);
        uint256 tokenId = rwa1155.createToken(
            "Test Token",
            "TEST",
            1000,
            true,
            true,
            true,
            ""
        );
        
        vm.prank(owner);
        rwa1155.setTokenWhitelist(tokenId, user1, true);
        
        assertTrue(rwa1155.isTokenWhitelisted(tokenId, user1));
        
        vm.prank(owner);
        rwa1155.setTokenWhitelist(tokenId, user1, false);
        
        assertFalse(rwa1155.isTokenWhitelisted(tokenId, user1));
    }
    
    function testTransferWithWhitelist() public {
        vm.prank(owner);
        uint256 tokenId = rwa1155.createToken(
            "Test Token",
            "TEST",
            1000,
            true,
            true,
            true,
            ""
        );
        
        // 用户1不在白名单中，无法接收转账
        vm.prank(owner);
        vm.expectRevert("RWA1155: transfer not allowed");
        rwa1155.safeTransferFrom(owner, user1, tokenId, 100, "");
        
        // 将用户1加入白名单
        vm.prank(owner);
        rwa1155.setWhitelist(user1, true);
        
        // 现在可以转账
        vm.prank(owner);
        rwa1155.safeTransferFrom(owner, user1, tokenId, 100, "");
        
        assertEq(rwa1155.balanceOf(user1, tokenId), 100);
    }
    
    // 版税功能已移除，此测试跳过
    
    function testSetURI() public {
        vm.prank(owner);
        rwa1155.setURI("https://new-api.example.com/token/{id}.json");
        
        assertEq(rwa1155.uri(0), "https://new-api.example.com/token/{id}.json");
    }
    
    // 暂停功能已移除，此测试跳过
    
    // 接口支持测试已简化
}