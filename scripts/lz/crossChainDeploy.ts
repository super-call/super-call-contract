import { ethers, network } from "hardhat";
import addressUtils from "../../utils/addressUtils";
import {
  Create3Deployer__factory,
  LzSuperCall__factory,
} from "../../typechain-types";
import { LzCall } from "@super-call/sdk";

const LZ_CHAIN_IDS = require("../../constants/chainIds.json");
const LZ_ENDPOINTS = require("../../constants/layerzeroEndpoints.json");

const getDeployCallData = async (
  salt: string,
  endpointAddr: string,
  chainId: number,
  owner: string
) => {
  const factory = new ethers.ContractFactory(
    LzSuperCall__factory.abi,
    LzSuperCall__factory.bytecode
  );
  const bytecode = await factory
    .getDeployTransaction(endpointAddr, chainId, owner)
    .then((tx) => tx.data);

  const deployerInterface = new ethers.Interface(Create3Deployer__factory.abi);
  return deployerInterface.encodeFunctionData("deploy", [bytecode, salt]);
};

async function main() {
  // Inputs
  const destChains = ["fuji"];

  const [signer] = await ethers.getSigners();

  const addressList = await addressUtils.getAddressList(network.name);
  const lzSuperCall = await LzSuperCall__factory.connect(
    addressList["LzSuperCall"],
    signer
  );

  const endpoint = await ethers.getContractAt(
    "ILayerZeroEndpoint",
    LZ_ENDPOINTS[network.name]
  );

  const deployer = await ethers.getContractAt(
    "Create3Deployer",
    addressList["Create3Deployer"]
  );

  const key = Math.random().toString(36).substring(7);
  const abiCoder = new ethers.AbiCoder();
  const salt = ethers.keccak256(abiCoder.encode(["string"], [key.toString()]));

  const promises = destChains.map(async (destChain) => {
    const destAddrList = await addressUtils.getAddressList(destChain);

    const destChainId = LZ_CHAIN_IDS[destChain];
    const target = destAddrList["Logger"];
    const callData = await getDeployCallData(
      salt,
      LZ_ENDPOINTS[destChain],
      LZ_CHAIN_IDS[destChain],
      signer.address
    );
    const lzSuperCallAddr = destAddrList["LzSuperCall"];

    const adapterParams = ethers.solidityPacked(
      ["uint16", "uint256"],
      [1, 200000]
    ); // default adapterParams example
    const call = new LzCall(destChainId, target, callData, lzSuperCallAddr);

    const payload = call.encode();
    console.log("Payload size: ", payload.length);

    const fees =
      destChain === network.name
        ? [BigInt(0)]
        : await endpoint.estimateFees(
            destChainId,
            lzSuperCallAddr,
            payload,
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

  console.log(`Deployed contracts with salt ${salt}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
