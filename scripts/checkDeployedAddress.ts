import { network } from "hardhat";
import addressUtils from "../utils/addressUtils";
import { deployedAddress } from "../utils/deployerUtilts";

async function main() {
  const addressList = await addressUtils.getAddressList(network.name);

  const deployerAddr = addressList["Create3Deployer"];
  const superCallAddr = addressList["AxlSuperCall"];
  const salt =
    "0x818f8312328732c9fc080bed69c2c2327c257bfac7723549916467f81ddb831d";

  const address = await deployedAddress(deployerAddr, superCallAddr, salt);

  console.log({ address });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
