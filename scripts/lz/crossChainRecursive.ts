import { ethers, network } from "hardhat";
import addressUtils from "../../utils/addressUtils";
import { Logger__factory, LzSuperCall__factory } from "../../typechain-types";
import { LzCall } from "@super-call/sdk";

const chainIds = require("../../constants/chainIds.json");
const endpoints = require("../../constants/layerzeroEndpoints.json");

const getLogCallData = (message: string) => {
  const loggerInterface = new ethers.Interface(Logger__factory.abi);
  return loggerInterface.encodeFunctionData("log", [message]);
};

const estimateGas = async (srcChain: string, destChain: string, callData: string) => {
  const destAddrList = await addressUtils.getAddressList(destChain);

  const destChainId = chainIds[destChain];

  const lzSuperCallAddr = destAddrList["LzSuperCall"];

  const endpoint = await ethers.getContractAt(
    "ILayerZeroEndpoint",
    endpoints[srcChain]
  );

  const adapterParams = ethers.solidityPacked(
    ["uint16", "uint256"],
    [1, 200000]
  ); // default adapterParams example

  const fees = await endpoint.estimateFees(
    destChainId,
    lzSuperCallAddr,
    callData,
    false,
    adapterParams
  );

  return fees[0]
}

const createCall = async (destChain: string, message: string) => {
  const destAddrList = await addressUtils.getAddressList(destChain);

  const destChainId = chainIds[destChain];
  const target = destAddrList["Logger"];
  const callData = getLogCallData(message);
  const lzSuperCallAddr = destAddrList["LzSuperCall"];

  const call = new LzCall(destChainId, target, callData, lzSuperCallAddr);
  return call;
}

async function main() {
  // Dest chains
  const destChains = ["mumbai"];

  // Main function
  const [signer] = await ethers.getSigners();

  const srcAddrList = await addressUtils.getAddressList(network.name);

  const lzSuperCall = LzSuperCall__factory.connect(
    srcAddrList["LzSuperCall"],
    signer
  );

  const promises = destChains.map(async (destChain) => {
    const call = await createCall(destChain, `Hello from ${network.name}`);
    call.addSubCall(await createCall(network.name, `Hello from ${destChain} subcall 1`));
    const fee = await estimateGas(network.name, destChain, call.encode());
    call.fee = fee.toString();
    return call;
  });

  const calls = await Promise.all(promises);
  const encodedCalls = calls.map((call) => call.encode());
  const totalFee = calls.reduce((prev, call) => prev + BigInt(call.calculateTotalFee()), BigInt(0));

  const tx = await lzSuperCall.aggregate(encodedCalls, { value: totalFee * BigInt(10) });
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
