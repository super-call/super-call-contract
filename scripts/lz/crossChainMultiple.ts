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

async function main() {
  // Dest chains
  const destChains = ["mumbai", "bsc-testnet", "fantom-testnet"];

  // Main function
  const [signer] = await ethers.getSigners();

  const srcAddrList = await addressUtils.getAddressList(network.name);

  const lzSuperCall = LzSuperCall__factory.connect(
    srcAddrList["LzSuperCall"],
    signer
  );

  const endpoint = await ethers.getContractAt(
    "ILayerZeroEndpoint",
    endpoints[network.name]
  );

  const promises = destChains.map(async (destChain) => {
    const destAddrList = await addressUtils.getAddressList(destChain);

    const destChainId = chainIds[destChain];
    const target = destAddrList["Logger"];
    const callData = getLogCallData(
      `Hello World Call from ${network.name}.`
    );
    const lzSuperCallAddr = destAddrList["LzSuperCall"];

    const adapterParams = ethers.solidityPacked(
      ["uint16", "uint256"],
      [1, 200000]
    ); // default adapterParams example
    const call = new LzCall(destChainId, target, callData, lzSuperCallAddr);
    const fees = await endpoint.estimateFees(
      destChainId,
      lzSuperCallAddr,
      call.encode(),
      false,
      adapterParams
    );

    return { call, fee: fees[0] };
  });

  const list = await Promise.all(promises);
  const encodedCalls = list.map((item) => item.call.encode());
  const totalFee = list.reduce((prev, item) => prev + item.fee, BigInt(0));

  const tx = await lzSuperCall.aggregate(encodedCalls, { value: totalFee });
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
