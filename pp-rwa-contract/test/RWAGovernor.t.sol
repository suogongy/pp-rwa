// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/RWAGovernor.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("Test Token", "TEST") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

contract RWAGovernorTest is Test {
    RWAGovernor public governor;
    TestToken public token;
    
    address public owner = address(1);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // 部署测试代币
        token = new TestToken();
        
        // 部署治理合约
        governor = new RWAGovernor(
            token,
            1, // votingDelay
            50400, // votingPeriod
            1000 * 10**18, // proposalThreshold
            4 // quorumNumerator
        );
        
        vm.stopPrank();
    }
    
    function testInitialization() public {
        assertEq(governor.name(), "RWAGovernor");
        assertEq(address(governor.token()), address(token));
        assertEq(governor.votingDelay(), 1);
        assertEq(governor.votingPeriod(), 50400);
        assertEq(governor.proposalThreshold(), 1000 * 10**18);
        assertEq(governor.quorumNumerator(), 4);
    }
    
    function testCountingMode() public {
        string memory mode = governor.COUNTING_MODE();
        assertEq(mode, "support=bravo&quorum=for,abstain");
    }
}