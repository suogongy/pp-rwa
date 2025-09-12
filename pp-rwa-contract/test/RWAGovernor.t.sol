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
        assertEq(governor.votingDelay(), 1);
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
}