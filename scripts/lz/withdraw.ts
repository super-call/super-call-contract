import { ethers, network } from "hardhat";
import addressUtils from "../../utils/addressUtils";
import {
  ILayerZeroEndpoint__factory,
  LzSuperCall__factory,
} from "../../typechain-types";

const chainIds = require("../../constants/chainIds.json");
const endpoints = require("../../constants/layerzeroEndpoints.json");

async function main() {
  const [signer] = await ethers.getSigners();
  const addressList = await addressUtils.getAddressList(network.name);
  const lzSupercall = LzSuperCall__factory.connect(
    addressList["LzSuperCall"],
    signer
  );

  const tx = await lzSupercall.withdraw();
  await tx.wait();

  const receipt = await tx.wait();
  console.log("Tx mined: ", receipt?.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
