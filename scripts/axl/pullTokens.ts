import { ethers, network } from "hardhat";
import addressUtils from "../../utils/addressUtils";
import { AxlCall } from "@super-call/sdk";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";
import {
  IAxelarGateway__factory,
  IERC20Metadata__factory,
} from "../../typechain-types";

type ChainConfig = {
  name: string;
  chainId: number;
  gateway: string;
  gasService: string;
  tokenSymbol: string;
  label: string;
};

const CHAIN_CONFIGS: ChainConfig[] = require("../../constants/axl/chain-configs.json");

async function createApproveCall({
  chainName,
  axlSuperCall,
  tokenAddress,
  spender,
  amount,
}: {
  chainName: string;
  axlSuperCall: string;
  tokenAddress: string;
  spender: string;
  amount: string;
}) {
  const [signer] = await ethers.getSigners();

  const token = IERC20Metadata__factory.connect(tokenAddress, signer);
  const callData = await token.interface.encodeFunctionData("approve", [
    spender,
    amount,
  ]);

  const call = new AxlCall(chainName, tokenAddress, callData, axlSuperCall);
  return call;
}

async function createSendTokenCall({
  chainName,
  axlSuperCall,
  gatewayAddress,
  destinationChain,
  destinationAddress,
  symbol,
  amount,
}: {
  chainName: string;
  axlSuperCall: string;
  gatewayAddress: string;
  destinationChain: string;
  destinationAddress: string;
  symbol: string;
  amount: string;
}) {
  const [signer] = await ethers.getSigners();

  const gateway = IAxelarGateway__factory.connect(gatewayAddress, signer);
  const callData = await gateway.interface.encodeFunctionData("sendToken", [
    destinationChain,
    destinationAddress,
    symbol,
    amount,
  ]);

  const call = new AxlCall(chainName, gatewayAddress, callData, axlSuperCall);
  return call;
}

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

  const sourceAxlSuperCallAddr = addressList["OwnedAxlSuperCall"];

  // Input
  const chains = ["bsc-testnet", "fantom-testnet"];

  const promises = chains.map(async (targetChain) => {
    // Contract address
    const addresses = await addressUtils.getAddressList(targetChain);

    // Chain
    const chainConfig = CHAIN_CONFIGS.find(
      (config) => config.label === targetChain
    );
    if (!chainConfig) throw new Error("Chain config not found");
    const chainName = chainConfig.name;
    const gatewayAddress = chainConfig.gateway;

    // Parameters
    const tokenSymbol = "aUSDC";
    const amount = ethers.parseUnits("2", 6).toString();

    // Create root call
    const call = await createApproveCall({
      chainName,
      axlSuperCall: addresses["OwnedAxlSuperCall"],
      tokenAddress: addresses[tokenSymbol],
      spender: gatewayAddress,
      amount,
    });

    // Add sub call
    call.addSubCall(
      await createSendTokenCall({
        chainName,
        axlSuperCall: addresses["OwnedAxlSuperCall"],
        gatewayAddress,
        destinationChain: sourceChain.name,
        destinationAddress: sourceAxlSuperCallAddr,
        symbol: tokenSymbol,
        amount,
      })
    );

    call.fee = (await axlAPI.estimateGasFee(
      sourceChain.name.toUpperCase(),
      chainConfig.name.toUpperCase(),
      sourceChain.tokenSymbol
    )) as string;

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
