import { ethers, network } from "hardhat";
import addressUtils from "../utils/addressUtils";
import { Logger__factory, LzSuperCall__factory } from "../typechain-types";
import { LzCall } from "@super-call/sdk";

const chainIds = require("../constants/chainIds.json");
const endpoints = require("../constants/layerzeroEndpoints.json");

const getLogCallData = (message: string) => {
  const loggerInterface = new ethers.Interface(Logger__factory.abi);
  return loggerInterface.encodeFunctionData("log", [message]);
};

async function main() {
  const [signer] = await ethers.getSigners();
  const addressList = await addressUtils.getAddressList(network.name);
  const lzSuperCall = LzSuperCall__factory.connect(
    addressList["LzSuperCall"],
    signer
  );

  const endpoint = await ethers.getContractAt("ILayerZeroEndpoint", endpoints[network.name])

  const networkId = chainIds["bsc-testnet"];
  const target = addressList["Logger"];
  const callData = getLogCallData(`Hello World Call from ${network.name}`);
  const lzSuperCallAddr = addressList["LzSuperCall"];
  const fee = "0";

  // let adapterParams = ethers.solidityPacked(["bytes"], [""]) // default adapterParams example
  let adapterParams = ethers.solidityPacked(["uint16", "uint256"], [1, 200000]) // default adapterParams example

  const call = new LzCall(networkId, target, callData, lzSuperCallAddr);
  const fees = await endpoint.estimateFees(networkId, lzSuperCallAddr, "0x", false, adapterParams)

  // call.fee = await lzSuperCall
  //   .estimateFee(networkId, false, [call.encode()], adapterParams)
  //   .then((res) => res.nativeFee.toString());
  //   call.fee = await lzSuperCall.aggregate
  //     .estimateGas([call.encode()])
  //     .then((res) => (res * BigInt(4)).toString());

  console.log(fees);

  const calls: string[] = [call.encode()];

  const tx = await lzSuperCall.aggregate(calls, { value: fees[0] });
  console.log(`Submitted tx ${tx.hash}`);
  const receipt = await tx.wait();

  console.log(`Called log successfully. Gas used: ${receipt?.gasUsed}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
