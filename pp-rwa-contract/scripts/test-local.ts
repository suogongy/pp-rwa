import { RWA20 } from "../typechain-types";
import { ethers } from "hardhat";

async function main() {
  console.log("Starting local anvil network testing...");

  // Deploy RWA20 contract
  const RWA20 = await ethers.getContractFactory("RWA20");
  const rwa20 = await RWA20.deploy(
    "Real World Asset Token",
    "RWA20",
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // Default hardhat account
  );

  await rwa20.deployed();
  console.log("RWA20 deployed to:", rwa20.address);

  // Get signers
  const [owner, user1, user2] = await ethers.getSigners();

  // Test minting
  console.log("Testing minting...");
  const mintTx = await rwa20.mint(user1.address, ethers.utils.parseEther("1000"));
  await mintTx.wait();
  console.log("Minted 1000 tokens to", user1.address);

  // Test transfer
  console.log("Testing transfer...");
  const transferTx = await rwa20.connect(user1).transfer(user2.address, ethers.utils.parseEther("100"));
  await transferTx.wait();
  console.log("Transferred 100 tokens from", user1.address, "to", user2.address);

  // Test batch transfer
  console.log("Testing batch transfer...");
  const batchTx = await rwa20.connect(owner).batchTransfer(
    [user1.address, user2.address],
    [ethers.utils.parseEther("50"), ethers.utils.parseEther("50")]
  );
  await batchTx.wait();
  console.log("Batch transfer completed");

  // Test whitelist
  console.log("Testing whitelist...");
  const whitelistTx = await rwa20.addToWhitelist(user1.address);
  await whitelistTx.wait();
  console.log("Added", user1.address, "to whitelist");

  // Test burning
  console.log("Testing burning...");
  const burnTx = await rwa20.connect(user2).burn(ethers.utils.parseEther("10"));
  await burnTx.wait();
  console.log("Burned 10 tokens from", user2.address);

  console.log("All tests completed!");
  console.log("Contract address:", rwa20.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});