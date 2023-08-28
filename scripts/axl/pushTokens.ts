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

  // Input
  const tokenSymbol = "aUSDC";
  const chains = ["mumbai", "bsc-testnet", 'fantom-testnet'];

  // Init AXL API
  const axlAPI = new AxelarQueryAPI({ environment: Environment.TESTNET });

  // Source chain
  const sourceChain = CHAIN_CONFIGS.find((ch) => ch.label === network.name);
  if (!sourceChain) throw new Error("Source chain not found");

  const sourceAxlSuperCallAddr = addressList["OwnedAxlSuperCall"];
  const sourceTokenAddr = addressList["aUSDC"];

  // Calculation
  const amount = ethers.parseUnits("0.5", 6).toString();
  const totalAmount = BigInt(amount) * BigInt(chains.length);

  // Root call
  const call = await createApproveCall({
    chainName: sourceChain.name,
    axlSuperCall: sourceAxlSuperCallAddr,
    tokenAddress: sourceTokenAddr,
    spender: sourceChain.gateway,
    amount: totalAmount.toString(),
  });

  // Sub calls
  const promises = chains.map(async (targetChain) => {
    // Contract address
    const addresses = await addressUtils.getAddressList(targetChain);

    // Chain
    const chainConfig = CHAIN_CONFIGS.find(
      (config) => config.label === targetChain
    );
    if (!chainConfig) throw new Error("Chain config not found");
    const chainName = chainConfig.name;

    // Call creation
    const call = await createSendTokenCall({
      chainName: sourceChain.name,
      axlSuperCall: sourceAxlSuperCallAddr,
      gatewayAddress: sourceChain.gateway,
      destinationChain: chainName,
      destinationAddress: addresses["OwnedAxlSuperCall"],
      symbol: tokenSymbol,
      amount,
    })

    return call;
  });

  const subCalls = await Promise.all(promises);
  subCalls.forEach(subCall => call.addSubCall(subCall));

  const encodedCalls = [call].map((c) => c.encode());
  const fee = [call].reduce(
    (acc, c) => (Number(acc) + Number(c.calculateTotalFee())).toString(),
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
