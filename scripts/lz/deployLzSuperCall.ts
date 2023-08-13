import { ethers, network } from "hardhat";
import addressUtils from "../../utils/addressUtils";

const LZ_CHAIN_IDS = require('../constants/chainIds.json')
const LZ_ENDPOINTS = require("../constants/layerzeroEndpoints.json");

async function main() {
  const lzSuperCall = await ethers.deployContract("LzSuperCall", [
    LZ_ENDPOINTS[network.name],
    LZ_CHAIN_IDS[network.name]
  ]);

  await lzSuperCall.waitForDeployment();

  console.log(
    `Deployed LZSuperCall to chain ${network.name} at address: ${lzSuperCall.target}`
  );

  await addressUtils.saveAddresses(network.name, {
    LzSuperCall: lzSuperCall.target.toString(),
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
