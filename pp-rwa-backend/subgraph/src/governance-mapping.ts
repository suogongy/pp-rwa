import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';
import {
  ProposalCreated as ProposalCreatedEvent,
  ProposalCanceled as ProposalCanceledEvent,
  ProposalExecuted as ProposalExecutedEvent,
  VoteCast as VoteCastEvent,
  ProposalThresholdSet as ProposalThresholdSetEvent,
  VotingDelaySet as VotingDelaySetEvent,
  VotingPeriodSet as VotingPeriodSetEvent,
  QuorumNumeratorUpdated as QuorumNumeratorUpdatedEvent
} from '../generated/RWAGovernor/RWAGovernor';
import { RWAGovernor, GovernanceProposal, GovernanceVote, GovernanceStats } from '../generated/schema';

// 处理合约部署
export function handleGovernorDeployed(event: any): void {
  let governor = new RWAGovernor(event.address.toHexString());
  governor.name = "RWAGovernor";
  governor.token = event.params.token;
  governor.timelock = event.params.timelock;
  governor.votingDelay = event.params.votingDelay;
  governor.votingPeriod = event.params.votingPeriod;
  governor.proposalThreshold = event.params.proposalThreshold;
  governor.quorumNumerator = event.params.quorumNumerator;
  governor.createdAt = event.block.timestamp;
  governor.save();
  
  // 初始化统计信息
  let stats = new GovernanceStats(event.address.toHexString());
  stats.totalProposals = BigInt.fromI32(0);
  stats.activeProposals = BigInt.fromI32(0);
  stats.passedProposals = BigInt.fromI32(0);
  stats.rejectedProposals = BigInt.fromI32(0);
  stats.executedProposals = BigInt.fromI32(0);
  stats.totalVotes = BigInt.fromI32(0);
  stats.uniqueVoters = BigInt.fromI32(0);
  stats.averageParticipation = BigDecimal.fromString("0");
  stats.lastUpdated = event.block.timestamp;
  stats.governor = governor.id;
  stats.save();
}

// 处理提案创建事件
export function handleProposalCreated(event: ProposalCreatedEvent): void {
  let proposalId = event.params.proposalId.toString();
  let proposal = new GovernanceProposal(proposalId);
  
  proposal.proposalId = event.params.proposalId;
  proposal.proposer = event.params.proposer;
  proposal.proposalType = "GENERAL"; // 默认类型，可根据实际数据调整
  proposal.description = event.params.description;
  proposal.ipfsHash = ""; // 从实际数据中获取
  proposal.targets = event.params.targets;
  proposal.values = event.params.values;
  proposal.calldatas = event.params.calldatas;
  proposal.startBlock = event.params.startBlock;
  proposal.endBlock = event.params.endBlock;
  proposal.createdAt = event.block.timestamp;
  proposal.deadline = event.block.timestamp.plus((event.params.endBlock.minus(event.params.startBlock)).times(BigInt.fromI32(12))); // 估算截止时间
  proposal.status = "PENDING";
  proposal.forVotes = BigInt.fromI32(0);
  proposal.againstVotes = BigInt.fromI32(0);
  proposal.abstainVotes = BigInt.fromI32(0);
  proposal.executed = false;
  proposal.governor = event.address.toHexString();
  
  proposal.save();
  
  // 更新统计信息
  updateGovernanceStats(event.address, BigInt.fromI32(1), BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0));
}

// 处理提案取消事件
export function handleProposalCanceled(event: ProposalCanceledEvent): void {
  let proposalId = event.params.proposalId.toString();
  let proposal = GovernanceProposal.load(proposalId);
  
  if (proposal) {
    proposal.status = "CANCELED";
    proposal.save();
    
    // 更新统计信息
    updateGovernanceStats(event.address, BigInt.fromI32(0), BigInt.fromI32(-1), BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0));
  }
}

// 处理提案执行事件
export function handleProposalExecuted(event: ProposalExecutedEvent): void {
  let proposalId = event.params.proposalId.toString();
  let proposal = GovernanceProposal.load(proposalId);
  
  if (proposal) {
    proposal.status = "EXECUTED";
    proposal.executed = true;
    proposal.executedAt = event.block.timestamp;
    proposal.executor = event.params.executor;
    proposal.save();
    
    // 更新统计信息
    updateGovernanceStats(event.address, BigInt.fromI32(0), BigInt.fromI32(-1), BigInt.fromI32(0), BigInt.fromI32(1), BigInt.fromI32(0));
  }
}

// 处理投票事件
export function handleVoteCast(event: VoteCastEvent): void {
  let voteId = event.transaction.hash.toHexString() + "_" + event.logIndex.toString();
  let vote = new GovernanceVote(voteId);
  
  vote.voter = event.params.voter;
  vote.proposalId = event.params.proposalId;
  
  // 映射投票类型
  let support = event.params.support;
  if (support == 0) {
    vote.support = "AGAINST";
  } else if (support == 1) {
    vote.support = "FOR";
  } else {
    vote.support = "ABSTAIN";
  }
  
  vote.votes = event.params.weight;
  vote.reason = event.params.reason;
  vote.transactionHash = event.transaction.hash.toHexString();
  vote.blockNumber = event.block.number;
  vote.timestamp = event.block.timestamp;
  vote.governor = event.address.toHexString();
  vote.proposal = event.params.proposalId.toString();
  
  vote.save();
  
  // 更新提案投票统计
  let proposal = GovernanceProposal.load(event.params.proposalId.toString());
  if (proposal) {
    if (vote.support == "FOR") {
      proposal.forVotes = proposal.forVotes.plus(event.params.weight);
    } else if (vote.support == "AGAINST") {
      proposal.againstVotes = proposal.againstVotes.plus(event.params.weight);
    } else {
      proposal.abstainVotes = proposal.abstainVotes.plus(event.params.weight);
    }
    proposal.save();
  }
  
  // 更新统计信息
  updateGovernanceStats(event.address, BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0), event.params.weight);
}

// 处理投票延迟设置事件
export function handleVotingDelaySet(event: VotingDelaySetEvent): void {
  let governor = RWAGovernor.load(event.address.toHexString());
  if (governor) {
    governor.votingDelay = event.params.newVotingDelay;
    governor.save();
  }
}

// 处理投票周期设置事件
export function handleVotingPeriodSet(event: VotingPeriodSetEvent): void {
  let governor = RWAGovernor.load(event.address.toHexString());
  if (governor) {
    governor.votingPeriod = event.params.newVotingPeriod;
    governor.save();
  }
}

// 处理提案阈值设置事件
export function handleProposalThresholdSet(event: ProposalThresholdSetEvent): void {
  let governor = RWAGovernor.load(event.address.toHexString());
  if (governor) {
    governor.proposalThreshold = event.params.newProposalThreshold;
    governor.save();
  }
}

// 处理法定人数更新事件
export function handleQuorumNumeratorUpdated(event: QuorumNumeratorUpdatedEvent): void {
  let governor = RWAGovernor.load(event.address.toHexString());
  if (governor) {
    governor.quorumNumerator = event.params.newQuorumNumerator;
    governor.save();
  }
}

// 更新治理统计信息
function updateGovernanceStats(
  governorAddress: Address,
  totalProposals: BigInt,
  activeProposals: BigInt,
  passedProposals: BigInt,
  executedProposals: BigInt,
  totalVotes: BigInt
): void {
  let stats = GovernanceStats.load(governorAddress.toHexString());
  if (stats) {
    stats.totalProposals = stats.totalProposals.plus(totalProposals);
    stats.activeProposals = stats.activeProposals.plus(activeProposals);
    stats.passedProposals = stats.passedProposals.plus(passedProposals);
    stats.executedProposals = stats.executedProposals.plus(executedProposals);
    stats.totalVotes = stats.totalVotes.plus(totalVotes);
    stats.lastUpdated = stats.block.timestamp;
    stats.save();
  }
}