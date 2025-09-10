// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {RWA721} from "../src/RWA721.sol";

contract RWA721Test is Test {
    RWA721 public nft;
    address public owner = address(0x1234);
    address public user1 = address(0x5678);
    address public user2 = address(0x9ABC);

    function setUp() public {
        vm.prank(owner);
        nft = new RWA721("Real World Asset NFT", "RWA721", "https://baseuri.com/", owner);
    }

    function test_InitialState() public view {
        assertEq(nft.name(), "Real World Asset NFT");
        assertEq(nft.symbol(), "RWA721");
        assertEq(nft.owner(), owner);
        assertFalse(nft.paused());
    }

    function test_MintNFT() public {
        vm.prank(owner);
        uint256 tokenId = nft.mintNFT(user1, "https://example.com/token/1");

        assertEq(tokenId, 0); // First token should have ID 0
        assertEq(nft.balanceOf(user1), 1);
        assertEq(nft.ownerOf(0), user1);
        // The URI is constructed by concatenating baseURI with the tokenURI
        assertEq(nft.tokenURI(0), "https://baseuri.com/https://example.com/token/1");
    }

    function test_MintBatch() public {
        string[] memory tokenURIs = new string[](3);
        tokenURIs[0] = "https://example.com/token/1";
        tokenURIs[1] = "https://example.com/token/2";
        tokenURIs[2] = "https://example.com/token/3";

        vm.prank(owner);
        uint256[] memory tokenIds = nft.mintBatchNFTs(user1, tokenURIs);

        assertEq(tokenIds.length, 3);
        assertEq(nft.balanceOf(user1), 3);
        assertEq(tokenIds[0], 0);
        assertEq(tokenIds[1], 1);
        assertEq(tokenIds[2], 2);
    }

    function test_BurnNFT() public {
        vm.prank(owner);
        uint256 tokenId = nft.mintNFT(user1, "https://example.com/token/1");

        vm.prank(user1);
        nft.burn(tokenId);

        assertEq(nft.balanceOf(user1), 0);
    }

    function test_SetBaseURI() public {
        vm.prank(owner);
        uint256 tokenId = nft.mintNFT(user1, "https://example.com/token/1");

        vm.prank(owner);
        nft.setBaseURI("https://new-example.com/token/");

        // Since we use _setTokenURI in mint, the baseURI change affects all tokens
        // because ERC721URIStorage concatenates baseURI with the stored tokenURI
        vm.prank(owner);
        uint256 newTokenId = nft.mintNFT(user1, "https://example.com/token/2");

        // First token now uses the new base URI
        assertEq(nft.tokenURI(tokenId), "https://new-example.com/token/https://example.com/token/1");

        // New token uses the new base URI
        assertEq(nft.tokenURI(newTokenId), "https://new-example.com/token/https://example.com/token/2");
    }

    function test_TransferNFT() public {
        vm.prank(owner);
        uint256 tokenId = nft.mintNFT(user1, "https://example.com/token/1");

        vm.prank(user1);
        nft.transferFrom(user1, user2, tokenId);

        assertEq(nft.balanceOf(user1), 0);
        assertEq(nft.balanceOf(user2), 1);
        assertEq(nft.ownerOf(tokenId), user2);
    }

    function test_ApproveAndTransferFrom() public {
        vm.prank(owner);
        uint256 tokenId = nft.mintNFT(user1, "https://example.com/token/1");

        vm.prank(user1);
        nft.approve(user2, tokenId);

        assertTrue(nft.getApproved(tokenId) == user2);

        vm.prank(user2);
        nft.transferFrom(user1, user2, tokenId);

        assertEq(nft.balanceOf(user1), 0);
        assertEq(nft.balanceOf(user2), 1);
        assertEq(nft.ownerOf(tokenId), user2);
    }

    function test_Pause() public {
        vm.prank(owner);
        uint256 tokenId = nft.mintNFT(user1, "https://example.com/token/1");

        vm.prank(owner);
        nft.pause();

        assertTrue(nft.paused());

        vm.expectRevert("EnforcedPause()");
        vm.prank(user1);
        nft.transferFrom(user1, user2, tokenId);
    }

    function test_Unpause() public {
        vm.prank(owner);
        uint256 tokenId = nft.mintNFT(user1, "https://example.com/token/1");

        vm.prank(owner);
        nft.pause();

        vm.prank(owner);
        nft.unpause();

        assertFalse(nft.paused());

        vm.prank(user1);
        nft.transferFrom(user1, user2, tokenId);

        assertEq(nft.balanceOf(user1), 0);
        assertEq(nft.balanceOf(user2), 1);
    }

    function test_OnlyOwnerMint() public {
        vm.expectRevert("OwnableUnauthorizedAccount(0x0000000000000000000000000000000000005678)");
        vm.prank(user1);
        nft.mintNFT(user1, "https://example.com/token/1");
    }

    function test_OnlyOwnerPause() public {
        vm.expectRevert("OwnableUnauthorizedAccount(0x0000000000000000000000000000000000005678)");
        vm.prank(user1);
        nft.pause();
    }

    function test_TokenNotExist() public {
        vm.expectRevert("ERC721NonexistentToken(999)");
        nft.ownerOf(999);
    }

    function test_BurnNonExistentToken() public {
        vm.expectRevert("ERC721NonexistentToken(999)");
        vm.prank(user1);
        nft.burn(999);
    }

    function test_BurnNotOwner() public {
        vm.prank(owner);
        uint256 tokenId = nft.mintNFT(user1, "https://example.com/token/1");

        vm.expectRevert("ERC721InsufficientApproval(0x0000000000000000000000000000000000009ABc, 0)");
        vm.prank(user2);
        nft.burn(tokenId);
    }

    function test_GasUsage() public {
        vm.prank(owner);
        uint256 gasStart = gasleft();
        nft.mintNFT(user1, "https://example.com/token/1");
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas used for mint:", gasUsed);

        assertTrue(gasUsed < 200000, "Mint should use less than 200,000 gas");
    }
}
