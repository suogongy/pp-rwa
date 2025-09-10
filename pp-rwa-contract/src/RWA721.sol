// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title RWA721
 * @dev Real World Asset NFT Contract - ERC721 standard with enhanced features
 *
 * Features:
 * 1. Standard Compliance - Fully compatible with ERC721 standard
 * 2. Batch Minting - Efficient batch NFT creation
 * 3. Metadata Management - IPFS integration for NFT metadata
 * 4. Royalty Support - Built-in royalty distribution
 * 5. Security - Comprehensive security measures
 */
contract RWA721 is ERC721, ERC721URIStorage, ERC721Burnable, Ownable, Pausable, ReentrancyGuard {
    using Strings for uint256;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI, bytes32 indexed txId);
    event BatchNFTMinted(address indexed to, uint256[] tokenIds, string baseURI, bytes32 indexed batchId);
    event RoyaltySet(uint256 indexed tokenId, address recipient, uint256 percentage);
    event BaseURIUpdated(string newBaseURI);
    event ContractMetadataUpdated(string contractURI);

    // State variables
    uint256 private _tokenIdCounter;

    // Mapping for token royalties
    mapping(uint256 => address) private _royaltyRecipients;
    mapping(uint256 => uint256) private _royaltyPercentages;

    // Base URI for metadata
    string private _baseTokenURI;

    // Contract URI for marketplace metadata
    string private _contractURI;

    // Gas optimization constants
    uint256 private constant MAX_BATCH_SIZE = 50;
    uint256 private constant MAX_ROYALTY_PERCENTAGE = 1000; // 10% max (1000 basis points)
    uint256 private constant BASIS_POINTS = 10000; // 100% = 10000 basis points

    /**
     * @dev Constructor
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param baseURI_ Base URI for metadata
     * @param initialOwner Contract owner
     */
    constructor(string memory name_, string memory symbol_, string memory baseURI_, address initialOwner)
        ERC721(name_, symbol_)
        Ownable(initialOwner)
    {
        _baseTokenURI = baseURI_;
        _contractURI = "";
    }

    /**
     * @dev Mint a single NFT
     * @param to Recipient address
     * @param tokenURI Metadata URI
     * @return tokenId The minted token ID
     */
    function mintNFT(address to, string memory tokenURI)
        public
        onlyOwner
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        require(to != address(0), "RWA721: mint to the zero address");
        require(bytes(tokenURI).length > 0, "RWA721: token URI cannot be empty");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Generate transaction ID for tracking
        bytes32 txId = keccak256(abi.encodePacked(block.timestamp, to, tokenId, tokenURI, blockhash(block.number - 1)));

        emit NFTMinted(to, tokenId, tokenURI, txId);

        return tokenId;
    }

    /**
     * @dev Mint multiple NFTs in batch
     * @param to Recipient address
     * @param tokenURIs Array of metadata URIs
     * @return tokenIds Array of minted token IDs
     */
    function mintBatchNFTs(address to, string[] memory tokenURIs)
        public
        onlyOwner
        whenNotPaused
        nonReentrant
        returns (uint256[] memory)
    {
        require(to != address(0), "RWA721: mint to the zero address");
        require(tokenURIs.length > 0, "RWA721: token URIs array cannot be empty");
        require(tokenURIs.length <= MAX_BATCH_SIZE, "RWA721: batch size too large");

        uint256[] memory tokenIds = new uint256[](tokenURIs.length);
        uint256 startTokenId = _tokenIdCounter;

        // Mint all NFTs
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            require(bytes(tokenURIs[i]).length > 0, "RWA721: token URI cannot be empty");

            uint256 tokenId = startTokenId + i;
            tokenIds[i] = tokenId;

            _safeMint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
        }

        _tokenIdCounter += tokenURIs.length;

        // Generate batch ID
        bytes32 batchId = keccak256(
            abi.encodePacked(block.timestamp, to, tokenURIs.length, startTokenId, blockhash(block.number - 1))
        );

        emit BatchNFTMinted(to, tokenIds, "", batchId);

        return tokenIds;
    }

    /**
     * @dev Set royalty information for a token
     * @param tokenId Token ID
     * @param recipient Royalty recipient
     * @param percentage Royalty percentage in basis points (100 = 1%)
     */
    function setRoyaltyInfo(uint256 tokenId, address recipient, uint256 percentage) public onlyOwner whenNotPaused {
        require(_ownerOf(tokenId) != address(0), "RWA721: token does not exist");
        require(recipient != address(0), "RWA721: royalty recipient cannot be zero");
        require(percentage <= MAX_ROYALTY_PERCENTAGE, "RWA721: royalty percentage too high");

        _royaltyRecipients[tokenId] = recipient;
        _royaltyPercentages[tokenId] = percentage;

        emit RoyaltySet(tokenId, recipient, percentage);
    }

    /**
     * @dev Get royalty information for a token
     * @param tokenId Token ID
     * @return recipient Royalty recipient
     * @return percentage Royalty percentage in basis points
     */
    function getRoyaltyInfo(uint256 tokenId) public view returns (address recipient, uint256 percentage) {
        require(_ownerOf(tokenId) != address(0), "RWA721: token does not exist");

        recipient = _royaltyRecipients[tokenId];
        percentage = _royaltyPercentages[tokenId];
    }

    /**
     * @dev Calculate royalty amount for a sale price
     * @param tokenId Token ID
     * @param salePrice Sale price
     * @return royaltyAmount Royalty amount to be paid
     */
    function calculateRoyalty(uint256 tokenId, uint256 salePrice) public view returns (uint256) {
        (, uint256 percentage) = getRoyaltyInfo(tokenId);
        return (salePrice * percentage) / BASIS_POINTS;
    }

    /**
     * @dev Set base URI for metadata
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) public onlyOwner whenNotPaused {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }

    /**
     * @dev Set contract URI for marketplace metadata
     * @param contractURI_ Contract metadata URI
     */
    function setContractURI(string memory contractURI_) public onlyOwner whenNotPaused {
        _contractURI = contractURI_;
        emit ContractMetadataUpdated(contractURI_);
    }

    /**
     * @dev Get base URI
     * @return Base URI string
     */
    function baseURI() public view returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Get contract URI
     * @return Contract URI string
     */
    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    /**
     * @dev Get total supply
     * @return Total number of NFTs minted
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Get token IDs owned by an address
     * @param owner Address to query
     * @return Array of token IDs
     */
    function getOwnedTokens(address owner) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        uint256 index = 0;

        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (_ownerOf(i) == owner) {
                tokenIds[index] = i;
                index++;
            }
        }

        return tokenIds;
    }

    /**
     * @dev Pause contract
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Override _update to add pause functionality
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override _baseURI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Override tokenURI to use base URI construction
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721Metadata: URI query for nonexistent token");

        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override supportsInterface
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Get contract information
     * @return contractName Contract name
     * @return contractSymbol Contract symbol
     * @return contractOwner Contract owner address
     * @return totalNFTSupply Total NFT supply
     * @return isPaused Contract pause status
     * @return baseTokenURI Base token URI
     * @return contractMetadataURI Contract metadata URI
     * @return maxBatchSize Maximum batch size
     * @return maxRoyaltyPercentage Maximum royalty percentage
     */
    function contractInfo()
        public
        view
        returns (
            string memory contractName,
            string memory contractSymbol,
            address contractOwner,
            uint256 totalNFTSupply,
            bool isPaused,
            string memory baseTokenURI,
            string memory contractMetadataURI,
            uint256 maxBatchSize,
            uint256 maxRoyaltyPercentage
        )
    {
        return (
            name(),
            symbol(),
            owner(),
            totalSupply(),
            paused(),
            _baseTokenURI,
            _contractURI,
            MAX_BATCH_SIZE,
            MAX_ROYALTY_PERCENTAGE
        );
    }

    /**
     * @dev Emergency function to recover stuck NFTs
     * @param tokenAddress NFT contract address
     * @param tokenId Token ID to recover
     */
    function emergencyRecoverNFT(address tokenAddress, uint256 tokenId) public onlyOwner whenPaused {
        require(tokenAddress != address(0), "RWA721: invalid token address");
        require(tokenAddress != address(this), "RWA721: cannot recover own NFTs");

        IERC721(tokenAddress).transferFrom(address(this), owner(), tokenId);
    }
}
