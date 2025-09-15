// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title RWAGovernor
 * @dev RWA项目治理合约 - 基于OpenZeppelin Governor v5标准
 * 功能特点：
 * - 完整的提案创建、投票、执行流程
 * - 基于ERC20代币的投票权重
 * - 支持代理投票和离线签名
 * - 时间锁控制机制
 * - 可配置的治理参数
 * - 前端兼容性函数
 */
contract RWAGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction, GovernorTimelockControl {
    // 提案计数器 - 用于前端兼容性
    uint256 public proposalCount;
    
    // 提案ID数组 - 存储所有已创建的提案ID
    uint256[] public proposalIds;
    
    // 提案元数据映射 - 只存储OpenZeppelin未提供的数据
    struct ProposalMetadata {
        uint256 createdAt;       // 创建时间
        string extraInfo;        // 额外信息（可选）
    }

    mapping(uint256 => ProposalMetadata) public proposalMetadata;

    constructor(IVotes _token, TimelockController _timelock)
        Governor("RWAGovernor")
        GovernorSettings(0 /* voting delay: 0 blocks - immediate voting */, 50400 /* voting period: 1 week */, 1000 ether /* proposal threshold */)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) /* 4% quorum */
        GovernorTimelockControl(_timelock)
    {
        // 初始化提案计数
        proposalCount = 0;
    }

    // === OpenZeppelin Governor 标准override函数 ===

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 timepoint)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(timepoint);
    }

    function _queueOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint48)
    {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    // === RWA项目个性化功能 ===

    /**
     * @dev 获取提案总数 (兼容性函数)
     */
    function getProposalCount() external view returns (uint256) {
        return proposalCount;
    }
    
    /**
     * @dev 获取所有提案ID列表
     */
    function getAllProposalIds() external view returns (uint256[] memory) {
        return proposalIds;
    }
    
    /**
     * @dev 获取指定范围的提案ID列表
     * @param offset 起始索引
     * @param limit 返回数量限制
     */
    function getProposalIdsByRange(uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        if (offset >= proposalIds.length) {
            return new uint256[](0);
        }
        
        uint256 end = offset + limit;
        if (end > proposalIds.length) {
            end = proposalIds.length;
        }
        
        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = 0; i < end - offset; i++) {
            result[i] = proposalIds[offset + i];
        }
        
        return result;
    }

    /**
     * @dev 获取提案状态字符串描述 (兼容性函数)
     */
    function getProposalState(uint256 proposalId) external view returns (string memory) {
        ProposalState stateValue = this.state(proposalId);
        
        if (stateValue == ProposalState.Pending) return "Pending";
        if (stateValue == ProposalState.Active) return "Active";
        if (stateValue == ProposalState.Canceled) return "Canceled";
        if (stateValue == ProposalState.Defeated) return "Defeated";
        if (stateValue == ProposalState.Succeeded) return "Succeeded";
        if (stateValue == ProposalState.Queued) return "Queued";
        if (stateValue == ProposalState.Expired) return "Expired";
        if (stateValue == ProposalState.Executed) return "Executed";
        
        return "Unknown";
    }

    /**
     * @dev 创建新提案 (重写以增加提案计数和存储提案ID)
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override returns (uint256) {
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        
        // 增加提案计数用于前端兼容性
        proposalCount++;
        
        // 存储提案ID到数组
        proposalIds.push(proposalId);
        
        // 存储提案元数据（只存储OpenZeppelin未提供的数据）
        proposalMetadata[proposalId] = ProposalMetadata({
            createdAt: block.timestamp,
            extraInfo: ""  // 可选的额外信息
        });
        
        return proposalId;
    }

    /**
     * @dev 获取提案基本信息（优化版 - 使用OpenZeppelin标准数据）
     */
    function getProposalBasicInfo(uint256 proposalId) external view returns (
        address proposer,
        uint256 createdAt,
        string memory extraInfo
    ) {
        // 使用OpenZeppelin标准函数获取提案者
        proposer = this.proposalProposer(proposalId);

        // 获取提案元数据
        ProposalMetadata storage metadata = proposalMetadata[proposalId];
        createdAt = metadata.createdAt;
        extraInfo = metadata.extraInfo;
    }

    /**
     * @dev 获取提案投票信息（使用OpenZeppelin标准数据）
     */
    function getProposalVotes(uint256 proposalId) external view returns (
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes
    ) {
        // 直接使用OpenZeppelin标准函数
        (againstVotes, forVotes, abstainVotes) = this.proposalVotes(proposalId);
    }

    /**
     * @dev 获取提案完整信息（优化版 - 使用OpenZeppelin标准数据）
     */
    function getProposalFullInfo(uint256 proposalId) external view returns (
        address proposer,
        uint256 voteStart,
        uint256 voteEnd,
        bool executed,
        bool canceled,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        uint256 createdAt,
        string memory extraInfo
    ) {
        // 使用OpenZeppelin标准函数获取基本信息
        proposer = this.proposalProposer(proposalId);
        voteStart = this.proposalSnapshot(proposalId);
        voteEnd = this.proposalDeadline(proposalId);

        // 获取提案状态
        ProposalState currentState = this.state(proposalId);
        executed = (currentState == ProposalState.Executed);
        canceled = (currentState == ProposalState.Canceled);

        // 获取投票数据
        (againstVotes, forVotes, abstainVotes) = this.proposalVotes(proposalId);

        // 获取元数据
        ProposalMetadata storage metadata = proposalMetadata[proposalId];
        createdAt = metadata.createdAt;
        extraInfo = metadata.extraInfo;
    }

    /**
     * @dev 获取提案详细信息（旧版本 - 保留向后兼容性）
     * @notice 这个函数由于堆栈限制问题，建议使用上面分离的函数
     */
    function getProposalDetails(uint256 proposalId) external view returns (
        address proposer,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        uint256 voteStart,
        uint256 voteEnd,
        bool executed,
        bool canceled,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes
    ) {
        // 使用OpenZeppelin标准函数获取基本信息
        proposer = this.proposalProposer(proposalId);
        voteStart = this.proposalSnapshot(proposalId);
        voteEnd = this.proposalDeadline(proposalId);

        // 获取提案状态
        ProposalState currentState = this.state(proposalId);
        executed = (currentState == ProposalState.Executed);
        canceled = (currentState == ProposalState.Canceled);

        // 获取投票数据
        (againstVotes, forVotes, abstainVotes) = this.proposalVotes(proposalId);

        // 对于targets、values、calldatas、description，返回空数组/字符串
        // 这些数据应该通过事件获取，而不是存储
        targets = new address[](0);
        values = new uint256[](0);
        calldatas = new bytes[](0);
        description = "";
    }
    
}