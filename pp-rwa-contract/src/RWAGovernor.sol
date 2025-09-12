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
     * @dev 创建新提案 (重写以增加提案计数)
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
        
        return proposalId;
    }

    /**
     * @dev 获取提案详细信息 (兼容性函数)
     * 注意：此函数使用Governor标准接口获取提案信息
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
        // 获取提案详情 - 使用简化方法以保持兼容性
        // 注意：在OpenZeppelin v5中，提案详情访问方式有所不同
        proposer = address(0); // 占位符 - 实际实现需要通过事件或其他方式获取
        voteStart = this.proposalSnapshot(proposalId);
        voteEnd = this.proposalDeadline(proposalId);
        
        // 获取提案状态
        ProposalState proposalState = this.state(proposalId);
        executed = (proposalState == ProposalState.Executed);
        canceled = (proposalState == ProposalState.Canceled);
        
        // 投票计数 - 需要通过专门的投票查询函数获取
        forVotes = 0; // 占位符
        againstVotes = 0; // 占位符
        abstainVotes = 0; // 占位符
        
        // 其他信息占位符
        targets = new address[](0);
        values = new uint256[](0);
        calldatas = new bytes[](0);
        description = "Proposal details not available in this version";
    }
}