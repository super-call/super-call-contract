import { ethers, network } from "hardhat";
import addressUtils from "../utils/addressUtils";

async function main() {
  const deployer = await ethers.deployContract("Create3Deployer", []);

  await deployer.waitForDeployment();

  console.log(
    `Deployed Deploter to chain ${network.name} at address: ${deployer.target}`
  );

  await addressUtils.saveAddresses(network.name, {
    Create3Deployer: deployer.target.toString(),
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
