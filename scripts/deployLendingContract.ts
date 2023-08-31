import { ethers, network } from "hardhat";
import addressUtils from "../utils/addressUtils";

async function main() {
  const lendingContract = await ethers.deployContract("LendingContract", []);
  await lendingContract.waitForDeployment();
  console.log(
    `Deployed LendingContract to chain ${network.name} at address: ${lendingContract.target}`
  );

  await addressUtils.saveAddresses(network.name, {
    LendingContract: lendingContract.target.toString(),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
