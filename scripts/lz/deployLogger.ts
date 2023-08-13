import { ethers, network } from "hardhat";
import addressUtils from "../../utils/addressUtils";

async function main() {
  const logger = await ethers.deployContract("Logger", []);

  await logger.waitForDeployment();

  console.log(
    `Deployed Logger to chain ${network.name} at address: ${logger.target}`
  );

  await addressUtils.saveAddresses(network.name, {
    Logger: logger.target.toString(),
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
