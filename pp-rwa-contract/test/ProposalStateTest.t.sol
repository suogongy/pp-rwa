// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/RWAGovernor.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract TestToken is ERC20, IVotes {
    constructor() ERC20("Test Token", "TEST") {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function getVotes(address account) public view override returns (uint256) {
        return balanceOf(account);
    }

    function delegates(address account) public view override returns (address) {
        return account;
    }

    function clock() public view returns (uint48) {
        return uint48(block.number);
    }

    function CLOCK_MODE() public pure returns (string memory) {
        return "mode=blocknumber&from=default";
    }

    function getPastVotes(address account, uint256 timepoint) public view override returns (uint256) {
        return getVotes(account);
    }

    function getPastTotalSupply(uint256 timepoint) public view override returns (uint256) {
        return totalSupply();
    }

    function delegate(address delegatee) public override {}
    function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) public override {}
}

contract ProposalStateTest is Test {
    RWAGovernor public governor;
    TestToken public token;
    TimelockController public timelock;

    address public owner = address(1);

    function setUp() public {
        vm.startPrank(owner);

        // 部署测试代币
        token = new TestToken();

        // 部署时间锁控制器
        uint256 minDelay = 1 days;
        address[] memory proposers = new address[](1);
        proposers[0] = owner;
        address[] memory executors = new address[](1);
        executors[0] = owner;

        timelock = new TimelockController(minDelay, proposers, executors, owner);

        // 部署治理合约
        governor = new RWAGovernor(token, timelock);

        vm.stopPrank();
    }

    function testProposalImmediateActiveState() public {
        vm.startPrank(owner);

        // 给owner足够的代币来达到提案门槛
        deal(address(token), owner, 2000 * 10**18);

        // 创建测试提案
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = hex"";
        string memory description = "Test Immediate Active Proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // 即使votingDelay为0，可能也需要推进一个区块
        vm.roll(block.number + 1);

        // 验证提案状态应该是Active（因为votingDelay = 0）
        uint256 currentState = uint256(governor.state(proposalId));
        uint256 activeState = 1; // Governor.ProposalState.Active = 1

        console.log("Proposal ID:", proposalId);
        console.log("Proposal State:", currentState);
        console.log("Active State:", activeState);

        // 验证提案状态确实是Active
        assertEq(currentState, activeState);

        // 验证投票时间设置正确
        uint256 voteStart = governor.proposalSnapshot(proposalId);
        uint256 voteEnd = governor.proposalDeadline(proposalId);

        console.log("Vote Start Block:", voteStart);
        console.log("Vote End Block:", voteEnd);
        console.log("Current Block:", block.number);

        // 验证投票开始时间应该是当前区块或之前（因为votingDelay = 0）
        assertTrue(voteStart <= block.number);

        // 验证投票结束时间应该在开始时间之后
        assertTrue(voteEnd > voteStart);

        vm.stopPrank();
    }

    function testVotingDelayConfiguration() public {
        // 验证votingDelay确实设置为0
        assertEq(governor.votingDelay(), 0);

        // 验证其他配置保持不变
        assertEq(governor.votingPeriod(), 50400);
        assertEq(governor.proposalThreshold(), 1000 ether);
        assertEq(governor.quorumNumerator(), 4);
    }
}