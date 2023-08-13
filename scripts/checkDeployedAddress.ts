import { ethers, network } from "hardhat";
import addressUtils from "../utils/addressUtils";
import { Create3Deployer__factory } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  const addressList = await addressUtils.getAddressList(network.name);
  const deployer = Create3Deployer__factory.connect(
    addressList["Create3Deployer"],
    signer
  );

  const deployerAddr = addressList["LzSuperCall"]
  const salt = "";

  const address = await deployer.deployedAddress(deployerAddr, salt);

  console.log(address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
