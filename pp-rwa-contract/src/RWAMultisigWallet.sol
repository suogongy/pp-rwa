// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/Address.sol";
// Counters moved to OpenZeppelin's own implementation
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title RWAMultisigWallet
 * @dev RWA项目多签钱包合约，支持灵活的签名策略和多种资产类型
 * 功能特点：
 * - 灵活的签名阈值设置
 * - 支持ETH和ERC20代币转账
 * - 支持ERC721和ERC1155 NFT转账
 * - 合约交互功能
 * - 交易历史记录
 * - 签名者管理
 * - 紧急暂停功能
 */
contract RWAMultisigWallet is Ownable, EIP712 {
    using Address for address payable;
        using ECDSA for bytes32;
    
    // 交易类型枚举
    enum TransactionType {
        ETHER_TRANSFER,
        ERC20_TRANSFER,
        ERC721_TRANSFER,
        ERC1155_TRANSFER,
        CONTRACT_CALL,
        BATCH_TRANSFER
    }
    
    // 交易状态枚举
    enum TransactionStatus {
        PENDING,
        EXECUTED,
        CANCELLED
    }
    
    // 交易结构
    struct Transaction {
        uint256 id;
        TransactionType transactionType;
        address destination;
        uint256 value;
        bytes data;
        uint256 nonce;
        uint256 deadline;
        TransactionStatus status;
        uint256 timestamp;
        address executor;
        uint256 gasUsed;
    }
    
    // 签名者信息
    struct Signer {
        address signer;
        bool active;
        uint256 joinedAt;
        uint256 transactionCount;
    }
    
    // 签名请求
    struct SignatureRequest {
        uint256 transactionId;
        address signer;
        bytes signature;
        uint256 timestamp;
    }
    
    // 交易计数器
    uint256 private _transactionIds;
    
    // 签名者数量
    uint256 public signerCount;
    
    // 签名阈值
    uint256 public signatureThreshold;
    
    // 签名者映射
    mapping(address => Signer) public signers;
    mapping(address => bool) public isSigner;
    
    // 交易映射
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public signatures;
    mapping(uint256 => uint256) public signatureCount;
    
    // 签名请求历史
    mapping(uint256 => SignatureRequest[]) public signatureHistory;
    
    // 紧急暂停状态
    bool public emergencyPaused;
    
    // 交易时间限制
    uint256 public constant TRANSACTION_EXPIRY = 7 days;
    uint256 public constant MAX_SIGNERS = 20;
    
    // EIP712类型哈希
    bytes32 private constant TRANSACTION_TYPEHASH = 
        keccak256("Transaction(uint256 transactionType,address destination,uint256 value,bytes data,uint256 nonce,uint256 deadline)");
    
    // 事件
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event SignerDeactivated(address indexed signer);
    event SignerActivated(address indexed signer);
    event SignatureThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event TransactionCreated(uint256 indexed transactionId, TransactionType transactionType, address indexed destination);
    event TransactionSigned(uint256 indexed transactionId, address indexed signer);
    event TransactionExecuted(uint256 indexed transactionId, address indexed executor, uint256 gasUsed);
    event TransactionCancelled(uint256 indexed transactionId);
    event EmergencyPaused(address indexed by);
    event EmergencyUnpaused(address indexed by);
    
    /**
     * @dev 构造函数
     * @param initialSigners 初始签名者数组
     * @param initialThreshold 初始签名阈值
     */
    constructor(address[] memory initialSigners, uint256 initialThreshold) Ownable(msg.sender) EIP712("RWAMultisigWallet", "1") {
        require(initialSigners.length > 0, "Multisig: no initial signers");
        require(initialThreshold > 0 && initialThreshold <= initialSigners.length, "Multisig: invalid threshold");
        require(initialSigners.length <= MAX_SIGNERS, "Multisig: too many signers");
        
        signatureThreshold = initialThreshold;
        
        for (uint256 i = 0; i < initialSigners.length; i++) {
            address signer = initialSigners[i];
            require(signer != address(0), "Multisig: invalid signer");
            require(!isSigner[signer], "Multisig: duplicate signer");
            
            signers[signer] = Signer({
                signer: signer,
                active: true,
                joinedAt: block.timestamp,
                transactionCount: 0
            });
            isSigner[signer] = true;
            signerCount++;
            
            emit SignerAdded(signer);
        }
    }
    
    /**
     * @dev 创建ETH转账交易
     * @param destination 目标地址
     * @param amount 转账金额
     * @param deadline 截止时间
     * @return 交易ID
     */
    function createEtherTransaction(
        address destination,
        uint256 amount,
        uint256 deadline
    ) external onlySigner returns (uint256) {
        require(destination != address(0), "Multisig: invalid destination");
        require(amount > 0, "Multisig: invalid amount");
        require(deadline > block.timestamp, "Multisig: invalid deadline");
        
        return _createTransaction(
            TransactionType.ETHER_TRANSFER,
            destination,
            amount,
            "",
            deadline
        );
    }
    
    /**
     * @dev 创建ERC20转账交易
     * @param token 代币地址
     * @param destination 目标地址
     * @param amount 转账金额
     * @param deadline 截止时间
     * @return 交易ID
     */
    function createERC20Transaction(
        address token,
        address destination,
        uint256 amount,
        uint256 deadline
    ) external onlySigner returns (uint256) {
        require(token != address(0), "Multisig: invalid token");
        require(destination != address(0), "Multisig: invalid destination");
        require(amount > 0, "Multisig: invalid amount");
        require(deadline > block.timestamp, "Multisig: invalid deadline");
        
        bytes memory data = abi.encodeWithSignature("transfer(address,uint256)", destination, amount);
        
        return _createTransaction(
            TransactionType.ERC20_TRANSFER,
            token,
            0,
            data,
            deadline
        );
    }
    
    /**
     * @dev 创建ERC721转账交易
     * @param token 代币地址
     * @param destination 目标地址
     * @param tokenId 代币ID
     * @param deadline 截止时间
     * @return 交易ID
     */
    function createERC721Transaction(
        address token,
        address destination,
        uint256 tokenId,
        uint256 deadline
    ) external onlySigner returns (uint256) {
        require(token != address(0), "Multisig: invalid token");
        require(destination != address(0), "Multisig: invalid destination");
        require(deadline > block.timestamp, "Multisig: invalid deadline");
        
        bytes memory data = abi.encodeWithSignature("safeTransferFrom(address,address,uint256)", address(this), destination, tokenId);
        
        return _createTransaction(
            TransactionType.ERC721_TRANSFER,
            token,
            0,
            data,
            deadline
        );
    }
    
    /**
     * @dev 创建ERC1155转账交易
     * @param token 代币地址
     * @param destination 目标地址
     * @param tokenId 代币ID
     * @param amount 数量
     * @param deadline 截止时间
     * @return 交易ID
     */
    function createERC1155Transaction(
        address token,
        address destination,
        uint256 tokenId,
        uint256 amount,
        uint256 deadline
    ) external onlySigner returns (uint256) {
        require(token != address(0), "Multisig: invalid token");
        require(destination != address(0), "Multisig: invalid destination");
        require(amount > 0, "Multisig: invalid amount");
        require(deadline > block.timestamp, "Multisig: invalid deadline");
        
        bytes memory data = abi.encodeWithSignature("safeTransferFrom(address,address,uint256,uint256,bytes)", address(this), destination, tokenId, amount, "");
        
        return _createTransaction(
            TransactionType.ERC1155_TRANSFER,
            token,
            0,
            data,
            deadline
        );
    }
    
    /**
     * @dev 创建合约调用交易
     * @param destination 目标合约地址
     * @param value 金额
     * @param data 调用数据
     * @param deadline 截止时间
     * @return 交易ID
     */
    function createContractCall(
        address destination,
        uint256 value,
        bytes memory data,
        uint256 deadline
    ) external onlySigner returns (uint256) {
        require(destination != address(0), "Multisig: invalid destination");
        require(deadline > block.timestamp, "Multisig: invalid deadline");
        
        return _createTransaction(
            TransactionType.CONTRACT_CALL,
            destination,
            value,
            data,
            deadline
        );
    }
    
    /**
     * @dev 创建交易
     * @param transactionType 交易类型
     * @param destination 目标地址
     * @param value 金额
     * @param data 调用数据
     * @param deadline 截止时间
     * @return 交易ID
     */
    function _createTransaction(
        TransactionType transactionType,
        address destination,
        uint256 value,
        bytes memory data,
        uint256 deadline
    ) internal returns (uint256) {
        require(!emergencyPaused, "Multisig: emergency paused");
        
        _transactionIds++;
        uint256 transactionId = _transactionIds;
        
        transactions[transactionId] = Transaction({
            id: transactionId,
            transactionType: transactionType,
            destination: destination,
            value: value,
            data: data,
            nonce: _transactionIds,
            deadline: deadline,
            status: TransactionStatus.PENDING,
            timestamp: block.timestamp,
            executor: address(0),
            gasUsed: 0
        });
        
        emit TransactionCreated(transactionId, transactionType, destination);
        return transactionId;
    }
    
    /**
     * @dev 签名交易
     * @param transactionId 交易ID
     * @param signature 签名
     */
    function signTransaction(uint256 transactionId, bytes memory signature) external onlySigner {
        require(!emergencyPaused, "Multisig: emergency paused");
        
        Transaction storage transaction = transactions[transactionId];
        require(transaction.id == transactionId, "Multisig: transaction not found");
        require(transaction.status == TransactionStatus.PENDING, "Multisig: transaction not pending");
        require(block.timestamp <= transaction.deadline, "Multisig: transaction expired");
        require(!signatures[transactionId][msg.sender], "Multisig: already signed");
        
        // 验证签名
        bytes32 hash = _hashTransaction(transaction);
        address recoveredSigner = hash.recover(signature);
        require(recoveredSigner == msg.sender, "Multisig: invalid signature");
        
        signatures[transactionId][msg.sender] = true;
        signatureCount[transactionId]++;
        
        signatureHistory[transactionId].push(SignatureRequest({
            transactionId: transactionId,
            signer: msg.sender,
            signature: signature,
            timestamp: block.timestamp
        }));
        
        emit TransactionSigned(transactionId, msg.sender);
        
        // 如果达到阈值，自动执行交易
        if (signatureCount[transactionId] >= signatureThreshold) {
            _executeTransaction(transactionId);
        }
    }
    
    /**
     * @dev 执行交易
     * @param transactionId 交易ID
     */
    function executeTransaction(uint256 transactionId) external onlySigner {
        require(!emergencyPaused, "Multisig: emergency paused");
        
        Transaction storage transaction = transactions[transactionId];
        require(transaction.id == transactionId, "Multisig: transaction not found");
        require(transaction.status == TransactionStatus.PENDING, "Multisig: transaction not pending");
        require(block.timestamp <= transaction.deadline, "Multisig: transaction expired");
        require(signatureCount[transactionId] >= signatureThreshold, "Multisig: insufficient signatures");
        
        _executeTransaction(transactionId);
    }
    
    /**
     * @dev 执行交易内部函数
     * @param transactionId 交易ID
     */
    function _executeTransaction(uint256 transactionId) internal {
        Transaction storage transaction = transactions[transactionId];
        
        uint256 gasBefore = gasleft();
        
        if (transaction.transactionType == TransactionType.ETHER_TRANSFER) {
            payable(transaction.destination).sendValue(transaction.value);
        } else {
            (bool success, ) = transaction.destination.call{value: transaction.value}(transaction.data);
            require(success, "Multisig: execution failed");
        }
        
        uint256 gasUsed = gasBefore - gasleft();
        
        transaction.status = TransactionStatus.EXECUTED;
        transaction.executor = msg.sender;
        transaction.gasUsed = gasUsed;
        
        // 更新签名者交易计数
        for (uint256 i = 0; i < signatureHistory[transactionId].length; i++) {
            address signer = signatureHistory[transactionId][i].signer;
            signers[signer].transactionCount++;
        }
        
        emit TransactionExecuted(transactionId, msg.sender, gasUsed);
    }
    
    /**
     * @dev 取消交易
     * @param transactionId 交易ID
     */
    function cancelTransaction(uint256 transactionId) external onlySigner {
        Transaction storage transaction = transactions[transactionId];
        require(transaction.id == transactionId, "Multisig: transaction not found");
        require(transaction.status == TransactionStatus.PENDING, "Multisig: transaction not pending");
        require(signatures[transactionId][msg.sender], "Multisig: must be signer");
        
        transaction.status = TransactionStatus.CANCELLED;
        emit TransactionCancelled(transactionId);
    }
    
    /**
     * @dev 添加签名者
     * @param newSigner 新签名者
     */
    function addSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Multisig: invalid signer");
        require(!isSigner[newSigner], "Multisig: already signer");
        require(signerCount < MAX_SIGNERS, "Multisig: too many signers");
        
        signers[newSigner] = Signer({
            signer: newSigner,
            active: true,
            joinedAt: block.timestamp,
            transactionCount: 0
        });
        isSigner[newSigner] = true;
        signerCount++;
        
        emit SignerAdded(newSigner);
    }
    
    /**
     * @dev 移除签名者
     * @param signerToRemove 要移除的签名者
     */
    function removeSigner(address signerToRemove) external onlyOwner {
        require(isSigner[signerToRemove], "Multisig: not signer");
        require(signerCount > 1, "Multisig: cannot remove last signer");
        
        delete signers[signerToRemove];
        isSigner[signerToRemove] = false;
        signerCount--;
        
        // 如果签名者数量少于阈值，调整阈值
        if (signatureThreshold > signerCount) {
            signatureThreshold = signerCount;
        }
        
        emit SignerRemoved(signerToRemove);
    }
    
    /**
     * @dev 设置签名阈值
     * @param newThreshold 新阈值
     */
    function setSignatureThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold > 0 && newThreshold <= signerCount, "Multisig: invalid threshold");
        
        uint256 oldThreshold = signatureThreshold;
        signatureThreshold = newThreshold;
        
        emit SignatureThresholdUpdated(oldThreshold, newThreshold);
    }
    
    /**
     * @dev 激活签名者
     * @param signer 签名者地址
     */
    function activateSigner(address signer) external onlyOwner {
        require(isSigner[signer], "Multisig: not signer");
        require(!signers[signer].active, "Multisig: already active");
        
        signers[signer].active = true;
        emit SignerActivated(signer);
    }
    
    /**
     * @dev 停用签名者
     * @param signer 签名者地址
     */
    function deactivateSigner(address signer) external onlyOwner {
        require(isSigner[signer], "Multisig: not signer");
        require(signers[signer].active, "Multisig: already inactive");
        require(signerCount > 1, "Multisig: cannot deactivate last signer");
        
        signers[signer].active = false;
        emit SignerDeactivated(signer);
    }
    
    /**
     * @dev 紧急暂停
     */
    function emergencyPause() external onlyOwner {
        emergencyPaused = true;
        emit EmergencyPaused(msg.sender);
    }
    
    /**
     * @dev 取消紧急暂停
     */
    function emergencyUnpause() external onlyOwner {
        emergencyPaused = false;
        emit EmergencyUnpaused(msg.sender);
    }
    
    /**
     * @dev 获取交易哈希
     * @param transaction 交易结构
     * @return 交易哈希
     */
    function _hashTransaction(Transaction memory transaction) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    TRANSACTION_TYPEHASH,
                    uint256(transaction.transactionType),
                    transaction.destination,
                    transaction.value,
                    keccak256(transaction.data),
                    transaction.nonce,
                    transaction.deadline
                )
            )
        );
    }
    
    /**
     * @dev 获取交易状态
     * @param transactionId 交易ID
     * @return 交易状态
     */
    function getTransactionStatus(uint256 transactionId) external view returns (TransactionStatus) {
        return transactions[transactionId].status;
    }
    
    /**
     * @dev 获取交易详情
     * @param transactionId 交易ID
     * @return 交易详情
     */
    function getTransaction(uint256 transactionId) external view returns (Transaction memory) {
        return transactions[transactionId];
    }
    
    /**
     * @dev 获取签名历史
     * @param transactionId 交易ID
     * @return 签名历史
     */
    function getSignatureHistory(uint256 transactionId) external view returns (SignatureRequest[] memory) {
        return signatureHistory[transactionId];
    }
    
    /**
     * @dev 获取活跃签名者
     * @return 活跃签名者地址数组
     */
    function getActiveSigners() external view returns (address[] memory) {
        address[] memory activeSigners = new address[](signerCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < signerCount; i++) {
            address signer = address(uint160(i + 1));
            if (isSigner[signer] && signers[signer].active) {
                activeSigners[index] = signer;
                index++;
            }
        }
        
        // 调整数组大小
        assembly {
            mstore(activeSigners, index)
        }
        
        return activeSigners;
    }
    
    /**
     * @dev 检查是否为活跃签名者
     * @param account 账户地址
     * @return 是否为活跃签名者
     */
    function isActiveSigner(address account) external view returns (bool) {
        return isSigner[account] && signers[account].active;
    }
    
    /**
     * @dev 接收ETH
     */
    receive() external payable {}
    
    /**
     * @dev 修饰符：仅签名者
     */
    modifier onlySigner() {
        require(isSigner[msg.sender] && signers[msg.sender].active, "Multisig: not active signer");
        _;
    }
}