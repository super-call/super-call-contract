import { ethers, network } from "hardhat";
import addressUtils from "../../utils/addressUtils";
import { AxlCall } from "@super-call/sdk";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";

type ChainConfig = {
  name: string;
  chainId: number;
  gateway: string;
  gasService: string;
  tokenSymbol: string;
  label: string;
};

const CHAIN_CONFIGS: ChainConfig[] = require("../../constants/axl/chain-configs.json");

async function main() {
  const addressList = await addressUtils.getAddressList(network.name);

  const ownedAxlSuperCall = await ethers.getContractAt(
    "OwnedAxlSuperCall",
    addressList["OwnedAxlSuperCall"]
  );

  // Init AXL API
  const axlAPI = new AxelarQueryAPI({ environment: Environment.TESTNET });

  // Source chain
  const sourceChain = CHAIN_CONFIGS.find((ch) => ch.label === network.name);
  if (!sourceChain) throw new Error("Source chain not found");

  // Input
  const chains = ["mumbai", "fantom-testnet", "bsc-testnet"];

  const promises = chains.map(async (targetChain) => {
    // Contract address
    const addresses = await addressUtils.getAddressList(targetChain);

    // Chain
    const chainConfig = CHAIN_CONFIGS.find(
      (config) => config.label === targetChain
    );
    if (!chainConfig) throw new Error("Chain config not found");
    const chainName = chainConfig.name;

    // Target
    const target = addresses["Logger"];

    // CallData
    const logger = await ethers.getContractFactory("Logger");
    const callData = await logger.interface.encodeFunctionData("log", ["Hello"]);

    // SuperCall Address
    const ownedAxlSuperCall = addresses["OwnedAxlSuperCall"];
    if (!ownedAxlSuperCall) throw new Error("SuperCall address not found");

    const fee =
      targetChain === sourceChain.label
        ? "0"
        : await axlAPI.estimateGasFee(
            sourceChain.name.toUpperCase(),
            chainName.toUpperCase(),
            sourceChain.tokenSymbol
          );

    console.log(`Fee of ${chainName}: `, ethers.formatEther(fee as string));

    const call = new AxlCall(
      chainName,
      target,
      callData,
      ownedAxlSuperCall,
      fee as string
    );

    return call;
  });

  const calls = await Promise.all(promises);

  const encodedCalls = calls.map((call) => call.encode());
  const fee = calls.reduce(
    (acc, call) => (Number(acc) + Number(call.calculateTotalFee())).toString(),
    "0"
  );

  console.log("Fee: ", ethers.formatEther(fee));

  const tx = await ownedAxlSuperCall.aggregate(encodedCalls, { value: fee });
  console.log("Submit tx to: ", tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
