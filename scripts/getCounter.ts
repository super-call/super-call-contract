import { ethers, network } from "hardhat";
import addressUtils from "../utils/addressUtils";
import { LzSimpleApp__factory } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  const addressList = await addressUtils.getAddressList(network.name);
  const lzSimpleApp = LzSimpleApp__factory.connect(
    addressList["LzSimpleApp"],
    signer
  );

  const counter = await lzSimpleApp.counter();

  console.log(`Counter: ${counter}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
