// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title RWAGovernor
 * @dev RWA项目治理合约 - 简化版本
 * 功能特点：
 * - 基础框架，待后续扩展
 */
contract RWAGovernor {
    string public constant name = "RWAGovernor";
    
    ERC20 public token;
    
    constructor(
        ERC20 token_,
        uint256, /* initialVotingDelay */
        uint256, /* initialVotingPeriod */
        uint256, /* initialProposalThreshold */
        uint256 /* initialQuorumNumerator */
    ) {
        token = token_;
    }
    
    function votingDelay() external pure returns (uint256) {
        return 1;
    }
    
    function votingPeriod() external pure returns (uint256) {
        return 50400;
    }
    
    function proposalThreshold() external pure returns (uint256) {
        return 1000 ether;
    }
    
    function quorumNumerator() external pure returns (uint256) {
        return 4;
    }
    
    function COUNTING_MODE() external pure returns (string memory) {
        return "support=bravo&quorum=for,abstain";
    }
}