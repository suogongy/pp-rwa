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
    
    // Simple voting implementation - each token equals one vote
    function getVotes(address account) public view override returns (uint256) {
        return balanceOf(account);
    }
    
    function delegates(address account) public view override returns (address) {
        return account; // Simplified implementation, does not support delegation
    }
    
    // Implement clock function
    function clock() public view returns (uint48) {
        return uint48(block.number);
    }
    
    function CLOCK_MODE() public pure returns (string memory) {
        return "mode=blocknumber&from=default";
    }
    
    // Implement past votes functions (simplified for testing)
    function getPastVotes(address account, uint256 timepoint) public view override returns (uint256) {
        // Simplified: return current votes as past votes
        return getVotes(account);
    }
    
    function getPastTotalSupply(uint256 timepoint) public view override returns (uint256) {
        // Simplified: return current total supply as past supply
        return totalSupply();
    }
    
    // Implement delegation functions (simplified)
    function delegate(address delegatee) public override {
        // Simplified: no actual delegation, just emit event if needed
    }
    
    function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) public override {
        // Simplified: no actual delegation by sig
        require(block.timestamp <= expiry, "Signature expired");
    }
}

contract RWAGovernorTest is Test {
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
        governor = new RWAGovernor(
            token,
            timelock
        );
        
        vm.stopPrank();
    }
    
    function testInitialization() public {
        assertEq(governor.name(), "RWAGovernor");
        assertEq(governor.votingDelay(), 0);
        assertEq(governor.votingPeriod(), 50400);
        assertEq(governor.proposalThreshold(), 1000 * 10**18);
        assertEq(governor.quorumNumerator(), 4);
    }
    
    function testProposalCount() public {
        // 测试提案计数器初始化
        assertEq(governor.proposalCount(), 0);
    }
    
    function testGetProposalState() public {
        // Test proposal state function with nonexistent proposal
        try governor.state(1) returns (Governor.ProposalState) {
            // This should not happen for nonexistent proposal
            assertTrue(false, "Nonexistent proposal should not have a valid state");
        } catch {
            // Expected behavior: querying nonexistent proposal should revert
            assertTrue(true, "Correctly caught error for nonexistent proposal");
        }
    }
    
    function testCountingMode() public {
        string memory mode = governor.COUNTING_MODE();
        assertEq(mode, "support=bravo&quorum=for,abstain");
    }
    
    function testProposalIdManagement() public {
        // 测试提案ID管理功能
        vm.startPrank(owner);
        
        // 初始状态应该没有提案ID
        uint256[] memory initialIds = governor.getAllProposalIds();
        assertEq(initialIds.length, 0);
        
        // 创建一个测试提案
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = hex"";
        string memory description = "Test Proposal";
        
        // 给owner足够的代币来达到提案门槛
        deal(address(token), owner, 2000 * 10**18);
        
        // 创建提案
        uint256 proposalId = governor.propose(targets, values, calldatas, description);
        
        // 验证提案计数增加
        assertEq(governor.proposalCount(), 1);
        
        // 验证提案ID被添加到数组中
        uint256[] memory updatedIds = governor.getAllProposalIds();
        assertEq(updatedIds.length, 1);
        assertEq(updatedIds[0], proposalId);
        
        // 测试getProposalIdsByRange功能
        uint256[] memory rangeIds = governor.getProposalIdsByRange(0, 10);
        assertEq(rangeIds.length, 1);
        assertEq(rangeIds[0], proposalId);
        
        // 测试超出范围的查询
        uint256[] memory outOfRangeIds = governor.getProposalIdsByRange(1, 10);
        assertEq(outOfRangeIds.length, 0);
        
        vm.stopPrank();
    }
    
    function testGetProposalDetails() public {
        // 测试提案详情获取功能（向后兼容性）
        vm.startPrank(owner);

        // 给owner足够的代币
        deal(address(token), owner, 2000 * 10**18);

        // 创建测试提案
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        uint256[] memory values = new uint256[](1);
        values[0] = 100;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = hex"1234";
        string memory description = "Detailed Test Proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // 获取提案详情
        (
            address proposer,
            address[] memory proposalTargets,
            uint256[] memory proposalValues,
            bytes[] memory proposalCalldatas,
            string memory proposalDescription,
            uint256 voteStart,
            uint256 voteEnd,
            bool executed,
            bool canceled,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes
        ) = governor.getProposalDetails(proposalId);

        // 验证提案详情
        assertEq(proposer, owner);
        assertEq(proposalTargets.length, 1);
        assertEq(proposalTargets[0], address(token));
        assertEq(proposalValues.length, 1);
        assertEq(proposalValues[0], 100);
        assertEq(proposalCalldatas.length, 1);
        assertEq(proposalCalldatas[0], hex"1234");
        assertEq(proposalDescription, description);
        assertEq(executed, false);
        assertEq(canceled, false);
        assertEq(forVotes, 0);
        assertEq(againstVotes, 0);
        assertEq(abstainVotes, 0);

        // 验证投票时间设置正确
        assertTrue(voteStart > 0);
        assertTrue(voteEnd > voteStart);

        vm.stopPrank();
    }

    function testGetProposalBasicInfo() public {
        // 测试提案基本信息获取功能
        vm.startPrank(owner);

        // 给owner足够的代币
        deal(address(token), owner, 2000 * 10**18);

        // 创建测试提案
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = hex"";
        string memory description = "Basic Info Test Proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // 获取提案基本信息
        (
            address proposer,
            string memory proposalDescription,
            uint256 voteStart,
            uint256 voteEnd,
            bool executed,
            bool canceled
        ) = governor.getProposalBasicInfo(proposalId);

        // 验证基本信息
        assertEq(proposer, owner);
        assertEq(proposalDescription, description);
        assertEq(executed, false);
        assertEq(canceled, false);

        // 验证投票时间设置正确
        assertTrue(voteStart > 0);
        assertTrue(voteEnd > voteStart);

        vm.stopPrank();
    }

    function testGetProposalVotes() public {
        // 测试提案投票信息获取功能
        vm.startPrank(owner);

        // 给owner足够的代币
        deal(address(token), owner, 2000 * 10**18);

        // 创建测试提案
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = hex"";
        string memory description = "Votes Test Proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // 获取提案投票信息
        (
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes
        ) = governor.getProposalVotes(proposalId);

        // 验证投票信息（新提案应该都是0）
        assertEq(forVotes, 0);
        assertEq(againstVotes, 0);
        assertEq(abstainVotes, 0);

        vm.stopPrank();
    }

    function testGetProposalActions() public {
        // 测试提案执行参数获取功能
        vm.startPrank(owner);

        // 给owner足够的代币
        deal(address(token), owner, 2000 * 10**18);

        // 创建测试提案
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        uint256[] memory values = new uint256[](1);
        values[0] = 100;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = hex"5678";
        string memory description = "Actions Test Proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // 获取提案执行参数
        (
            address[] memory proposalTargets,
            uint256[] memory proposalValues,
            bytes[] memory proposalCalldatas
        ) = governor.getProposalActions(proposalId);

        // 验证执行参数
        assertEq(proposalTargets.length, 1);
        assertEq(proposalTargets[0], address(token));
        assertEq(proposalValues.length, 1);
        assertEq(proposalValues[0], 100);
        assertEq(proposalCalldatas.length, 1);
        assertEq(proposalCalldatas[0], hex"5678");

        vm.stopPrank();
    }

    function testSeparatedFunctionsConsistency() public {
        // 测试分离函数与原始函数的数据一致性
        vm.startPrank(owner);

        // 给owner足够的代币
        deal(address(token), owner, 2000 * 10**18);

        // 创建测试提案
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        uint256[] memory values = new uint256[](1);
        values[0] = 200;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = hex"9abc";
        string memory description = "Consistency Test Proposal";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // 使用分离函数获取数据 - 验证基本信息
        _testBasicInfoConsistency(proposalId);

        // 使用分离函数获取数据 - 验证投票信息
        _testVotesConsistency(proposalId);

        // 使用分离函数获取数据 - 验证执行参数
        _testActionsConsistency(proposalId);

        vm.stopPrank();
    }

    function _testBasicInfoConsistency(uint256 proposalId) internal {
        // 使用分离函数获取数据
        (
            address proposer1,
            string memory description1,
            uint256 voteStart1,
            uint256 voteEnd1,
            bool executed1,
            bool canceled1
        ) = governor.getProposalBasicInfo(proposalId);

        // 使用原始函数获取数据
        (
            address proposer2,
            ,
            ,
            ,
            string memory description2,
            uint256 voteStart2,
            uint256 voteEnd2,
            bool executed2,
            bool canceled2,
            ,
            ,

        ) = governor.getProposalDetails(proposalId);

        // 验证数据一致性
        assertEq(proposer1, proposer2);
        assertEq(description1, description2);
        assertEq(voteStart1, voteStart2);
        assertEq(voteEnd1, voteEnd2);
        assertEq(executed1, executed2);
        assertEq(canceled1, canceled2);
    }

    function _testVotesConsistency(uint256 proposalId) internal {
        // 使用分离函数获取数据
        (
            uint256 forVotes1,
            uint256 againstVotes1,
            uint256 abstainVotes1
        ) = governor.getProposalVotes(proposalId);

        // 使用原始函数获取数据
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 forVotes2,
            uint256 againstVotes2,
            uint256 abstainVotes2
        ) = governor.getProposalDetails(proposalId);

        // 验证数据一致性
        assertEq(forVotes1, forVotes2);
        assertEq(againstVotes1, againstVotes2);
        assertEq(abstainVotes1, abstainVotes2);
    }

    function _testActionsConsistency(uint256 proposalId) internal {
        // 使用分离函数获取数据
        (
            address[] memory targets1,
            uint256[] memory values1,
            bytes[] memory calldatas1
        ) = governor.getProposalActions(proposalId);

        // 使用原始函数获取数据
        (
            ,
            address[] memory targets2,
            uint256[] memory values2,
            bytes[] memory calldatas2,
            ,
            ,
            ,
            ,
            ,
            ,
            ,

        ) = governor.getProposalDetails(proposalId);

        // 验证数据一致性
        assertEq(targets1.length, targets2.length);
        assertEq(targets1[0], targets2[0]);
        assertEq(values1.length, values2.length);
        assertEq(values1[0], values2[0]);
        assertEq(calldatas1.length, calldatas2.length);
        assertEq(calldatas1[0], calldatas2[0]);
    }
    
    function testGetProposalStateString() public {
        // 测试提案状态字符串获取功能
        vm.startPrank(owner);
        
        // 给owner足够的代币
        deal(address(token), owner, 2000 * 10**18);
        
        // 创建测试提案
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = hex"";
        string memory description = "State Test Proposal";
        
        uint256 proposalId = governor.propose(targets, values, calldatas, description);
        
        // 获取提案状态字符串
        string memory stateString = governor.getProposalState(proposalId);
        
        // 验证状态字符串是已知的提案状态之一
        assertTrue(
            keccak256(bytes(stateString)) == keccak256(bytes("Pending")) ||
            keccak256(bytes(stateString)) == keccak256(bytes("Active")) ||
            keccak256(bytes(stateString)) == keccak256(bytes("Succeeded")) ||
            keccak256(bytes(stateString)) == keccak256(bytes("Executed")) ||
            keccak256(bytes(stateString)) == keccak256(bytes("Defeated")) ||
            keccak256(bytes(stateString)) == keccak256(bytes("Canceled")) ||
            keccak256(bytes(stateString)) == keccak256(bytes("Expired"))
        );
        
        vm.stopPrank();
    }
}