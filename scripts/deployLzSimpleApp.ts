import { ethers, network } from "hardhat";
import addressUtils from "../utils/addressUtils";

const endpoints = require('../constants/layerzeroEndpoints.json')

async function main() {

  const endpointAddress = endpoints[network.name];

  const lzSimpleApp = await ethers.deployContract("LzSimpleApp", [endpointAddress]);

  await lzSimpleApp.waitForDeployment();

  console.log(
    `Deployed Simple App to chain ${network.name} at address: ${lzSimpleApp.target}`
  );

  await addressUtils.saveAddresses(network.name, {
    LzSimpleApp: lzSimpleApp.target.toString(),
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
