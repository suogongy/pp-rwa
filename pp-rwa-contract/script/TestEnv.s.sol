// script/TestEnv.s.sol
pragma solidity ^0.8.24;
import "forge-std/Script.sol";

contract TestEnv is Script {
    function run() external {
        console.log("PRIVATE_KEY =", vm.envString("PRIVATE_KEY"));
        console.log("LOCAL_RPC_URL =", vm.envString("LOCAL_RPC_URL"));
        // console.log("GOVERNANCE_TOKEN_ADDRESS =", vm.envString("GOVERNANCE_TOKEN_ADDRESS"));
        console.log("RWA20_ADDRESS =", vm.envString("RWA20_ADDRESS"));
        console.log("GOVERNOR_ADDRESS =", vm.envString("GOVERNOR_ADDRESS"));
    }
}
