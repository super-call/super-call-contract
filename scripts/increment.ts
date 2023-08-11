import { ethers, network } from "hardhat";
import addressUtils from "../utils/addressUtils";
import { LzSimpleApp__factory } from "../typechain-types";

const chainIds = require("../constants/chainIds.json");
const endpoints = require("../constants/layerzeroEndpoints.json");

async function main() {
  const [signer] = await ethers.getSigners();
  const addressList = await addressUtils.getAddressList(network.name);

  const lzSimpleApp = LzSimpleApp__factory.connect(
    addressList["LzSimpleApp"],
    signer
  );

  const endpoint = await ethers.getContractAt(
    "ILayerZeroEndpoint",
    endpoints[network.name]
  );

  const chainId = chainIds["bsc-testnet"];

  console.log("ChainId: ", chainId);

  const adapterParams = ethers.solidityPacked(
    ["uint16", "uint256"],
    [1, 200000]
  ); // default adapterParams example

  const fees = await endpoint.estimateFees(
    chainId,
    addressList["LzSimpleApp"],
    "0x",
    false,
    adapterParams
  );

  console.log("Estimated gas fee: ", fees);

  const tx = await lzSimpleApp.inc(chainId, { value: fees[0] });
  console.log("Send tx: ", tx.hash);

  const receipt = await tx.wait();
  console.log("Tx mined: ", receipt?.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
