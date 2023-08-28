import { ethers, network } from "hardhat";
import addressUtils from "../utils/addressUtils";
import { IERC20Metadata__factory } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  const addressList = await addressUtils.getAddressList(network.name);
  const token = IERC20Metadata__factory.connect(addressList["aUSDC"], signer);

  const recipient = addressList["OwnedAxlSuperCall"];
  const amount = "3";

  const decimals = await token.decimals();

  const tx = await token.transfer(
    recipient,
    ethers.parseUnits(amount, decimals)
  );

  console.log("Submit transaction: ", tx.hash);
  await tx.wait();

  console.log(`Transfer ${amount} aUSDC to ${recipient}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
