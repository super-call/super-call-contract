import { ethers, network } from "hardhat";
import addressUtils from "../utils/addressUtils";
import { Logger__factory } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  const addressList = await addressUtils.getAddressList(network.name);
  const logger = Logger__factory.connect(addressList["Logger"], signer);

  const message = await logger.message();

  console.log(`Log message in chain ${network.name} is ${message}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
