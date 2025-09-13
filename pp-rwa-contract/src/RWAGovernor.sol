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
    
    // 提案详情映射 - 存储提案的详细信息
    struct ProposalDetails {
        address proposer;
        uint256 voteStart;
        uint256 voteEnd;
        bool executed;
        bool canceled;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
    }
    
    mapping(uint256 => ProposalDetails) public proposalDetails;

    constructor(IVotes _token, TimelockController _timelock)
        Governor("RWAGovernor")
        GovernorSettings(1 /* voting delay: 1 block */, 50400 /* voting period: 1 week */, 1000 ether /* proposal threshold */)
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
        
        // 存储提案详情
        proposalDetails[proposalId] = ProposalDetails({
            proposer: msg.sender,
            voteStart: this.proposalSnapshot(proposalId),
            voteEnd: this.proposalDeadline(proposalId),
            executed: false,
            canceled: false,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            description: description,
            targets: targets,
            values: values,
            calldatas: calldatas
        });
        
        return proposalId;
    }

    /**
     * @dev 获取提案详细信息 (改进版)
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
        ProposalDetails storage details = proposalDetails[proposalId];
        
        // 如果提案不存在或未初始化，使用Governor标准方法获取基本信息
        if (details.proposer == address(0)) {
            proposer = address(0); // 无法获取，需要通过事件或其他方式
            targets = new address[](0);
            values = new uint256[](0);
            calldatas = new bytes[](0);
            description = "Proposal details not available";
            voteStart = this.proposalSnapshot(proposalId);
            voteEnd = this.proposalDeadline(proposalId);
        } else {
            proposer = details.proposer;
            targets = details.targets;
            values = details.values;
            calldatas = details.calldatas;
            description = details.description;
            voteStart = details.voteStart;
            voteEnd = details.voteEnd;
        }
        
        // 获取提案状态
        ProposalState proposalState = this.state(proposalId);
        executed = (proposalState == ProposalState.Executed);
        canceled = (proposalState == ProposalState.Canceled);
        
        // 获取投票计数（如果有存储的数据）
        if (details.proposer != address(0)) {
            forVotes = details.forVotes;
            againstVotes = details.againstVotes;
            abstainVotes = details.abstainVotes;
        } else {
            // 如果没有存储数据，设置为0
            forVotes = 0;
            againstVotes = 0;
            abstainVotes = 0;
        }
    }
    
    /**
     * @dev 更新提案投票计数（在投票时调用）
     */
    function _updateProposalVoteCounts(uint256 proposalId) internal {
        // 这里可以在投票事件中更新投票计数
        // 实际实现可能需要监听VoteCast事件或重写投票函数
        // 目前返回存储的值，实际使用中需要集成投票更新逻辑
    }
    
    /**
     * @dev 更新提案执行状态（在执行提案时调用）
     */
    function _updateProposalExecutionState(uint256 proposalId, bool executedStatus) internal {
        if (proposalDetails[proposalId].proposer != address(0)) {
            proposalDetails[proposalId].executed = executedStatus;
        }
    }
    
    /**
     * @dev 更新提案取消状态（在取消提案时调用）
     */
    function _updateProposalCancelState(uint256 proposalId, bool canceledStatus) internal {
        if (proposalDetails[proposalId].proposer != address(0)) {
            proposalDetails[proposalId].canceled = canceledStatus;
        }
    }
}