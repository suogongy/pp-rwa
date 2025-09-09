// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RWA20
 * @dev Real World Asset Tokenization Contract - Optimized version based on OpenZeppelin standard library
 * 
 * Main Features:
 * 1. Standard Compliance - Fully compatible with ERC20 standard
 * 2. Security - Using OpenZeppelin security modules
 * 3. Gas Optimization - Improved algorithms and data structures
 * 4. Scalability - Modular design for easy upgrades
 * 5. Compliance - Built-in pause and access control
 */
contract RWA20 is ERC20, Ownable, Pausable, ReentrancyGuard {
    
    // Event definitions - Extending ERC20 standard events
    event TokensMinted(address indexed to, uint256 amount, bytes32 indexed txId);
    event TokensBurned(address indexed from, uint256 amount, bytes32 indexed txId);
    event WhitelistUpdated(address indexed account, bool status);
    event BatchTransferExecuted(address indexed from, address[] recipients, uint256[] amounts, bytes32 indexed batchId);
    
    // Whitelist status
    mapping(address => bool) private _whitelist;
    
    // Gas optimization: Using compact storage
    uint256 private constant MAX_BATCH_SIZE = 100;
    uint256 private constant INITIAL_SUPPLY = 1000000 * 10**18; // 1 million tokens
    
    /**
     * @dev Constructor - Using OpenZeppelin's ERC20 constructor
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        _mint(initialOwner, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Mint new tokens - Optimized minting function
     * @param to Recipient address
     * @param amount Minting amount
     */
    function mint(address to, uint256 amount) public onlyOwner whenNotPaused nonReentrant {
        require(to != address(0), "RWA20: mint to the zero address");
        require(amount > 0, "RWA20: mint amount must be positive");
        
        _mint(to, amount);
        
        // Generate unique transaction ID for tracking and compliance
        bytes32 txId = keccak256(abi.encodePacked(
            block.timestamp,
            to,
            amount,
            blockhash(block.number - 1),
            msg.sender
        ));
        
        emit TokensMinted(to, amount, txId);
    }
    
    /**
     * @dev Burn tokens - Improved burning function
     * @param amount Burning amount
     */
    function burn(uint256 amount) public whenNotPaused nonReentrant {
        require(amount > 0, "RWA20: burn amount must be positive");
        require(balanceOf(msg.sender) >= amount, "RWA20: burn amount exceeds balance");
        
        _burn(msg.sender, amount);
        
        // Generate unique transaction ID for tracking
        bytes32 txId = keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            amount,
            blockhash(block.number - 1)
        ));
        
        emit TokensBurned(msg.sender, amount, txId);
    }
    
    /**
     * @dev Batch transfer - Gas optimized batch operation
     * @param recipients Array of recipient addresses
     * @param amounts Array of transfer amounts
     */
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external whenNotPaused nonReentrant {
        require(recipients.length == amounts.length, "RWA20: arrays length mismatch");
        require(recipients.length > 0, "RWA20: empty arrays");
        require(recipients.length <= MAX_BATCH_SIZE, "RWA20: batch size too large");
        
        address sender = msg.sender;
        uint256 totalAmount = 0;
        
        // Gas optimization: Pre-calculate total amount to avoid repeated balance checks
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "RWA20: amount must be positive");
            totalAmount += amounts[i];
        }
        
        require(balanceOf(sender) >= totalAmount, "RWA20: insufficient balance");
        
        // Generate batch ID for tracking
        bytes32 batchId = keccak256(abi.encodePacked(
            block.timestamp,
            sender,
            recipients.length,
            blockhash(block.number - 1)
        ));
        
        // Execute batch transfer
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "RWA20: invalid recipient");
            _transfer(sender, recipients[i], amounts[i]);
        }
        
        emit BatchTransferExecuted(sender, recipients, amounts, batchId);
    }
    
    /**
     * @dev Whitelist management - Enhanced access control
     * @param account Account address to add
     */
    function addToWhitelist(address account) public onlyOwner whenNotPaused {
        require(account != address(0), "RWA20: invalid address");
        require(!_whitelist[account], "RWA20: account already whitelisted");
        
        _whitelist[account] = true;
        emit WhitelistUpdated(account, true);
    }
    
    /**
     * @dev Remove account from whitelist
     * @param account Account address to remove
     */
    function removeFromWhitelist(address account) public onlyOwner whenNotPaused {
        require(account != address(0), "RWA20: invalid address");
        require(_whitelist[account], "RWA20: account not whitelisted");
        
        _whitelist[account] = false;
        emit WhitelistUpdated(account, false);
    }
    
    /**
     * @dev Check whitelist status
     * @param account Account address to check
     * @return Whether in whitelist
     */
    function isWhitelisted(address account) public view returns (bool) {
        return _whitelist[account];
    }
    
    /**
     * @dev Pause contract - Using OpenZeppelin's Pausable
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract - Using OpenZeppelin's Pausable
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override _update function to add additional security checks
     * Using OpenZeppelin's _update as base
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        // Can add additional business logic checks
        // For example: specific transfer restrictions or compliance checks
        
        super._update(from, to, amount);
    }
    
    /**
     * @dev Emergency extraction function - Owner only
     * @param tokenAddress Token address
     * @param amount Extraction amount
     */
    function emergencyExtract(
        address tokenAddress,
        uint256 amount
    ) public onlyOwner whenPaused {
        require(tokenAddress != address(0), "RWA20: invalid token address");
        
        if (tokenAddress == address(this)) {
            // Extract this contract tokens
            require(balanceOf(address(this)) >= amount, "RWA20: insufficient contract balance");
            _transfer(address(this), owner(), amount);
        } else {
            // Extract other ERC20 tokens
            IERC20 externalToken = IERC20(tokenAddress);
            require(externalToken.balanceOf(address(this)) >= amount, "RWA20: insufficient external token balance");
            require(externalToken.transfer(owner(), amount), "RWA20: transfer failed");
        }
    }
    
    /**
     * @dev Version information - For contract upgrade identification
     * @return Contract version
     */
    function version() public pure returns (string memory) {
        return "2.0.0-OpenZeppelin";
    }
    
    /**
     * @dev Contract information - For frontend identification and integration
     * @return contractName Contract name
     * @return contractSymbol Contract symbol
     * @return contractDecimals Contract decimals
     * @return contractOwner Contract owner
     * @return isPaused Is paused
     * @return totalTokenSupply Total token supply
     * @return contractVersion Contract version
     */
    function contractInfo() public view returns (
        string memory contractName,
        string memory contractSymbol,
        uint8 contractDecimals,
        address contractOwner,
        bool isPaused,
        uint256 totalTokenSupply,
        string memory contractVersion
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            owner(),
            paused(),
            totalSupply(),
            version()
        );
    }
    
    /**
     * @dev Get batch processing limit
     * @return Maximum batch size
     */
    function getMaxBatchSize() public pure returns (uint256) {
        return MAX_BATCH_SIZE;
    }
    
    /**
     * @dev Check if contract can be upgraded
     * @return Whether upgradable
     */
    function isUpgradable() public pure returns (bool) {
        return false; // Current version is not upgradable
    }
}