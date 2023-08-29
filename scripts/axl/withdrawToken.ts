import { ethers, network } from "hardhat";
import addressUtils from "../../utils/addressUtils";
import { AxlCall } from "@super-call/sdk";
import { IERC20__factory } from "../../typechain-types";

type ChainConfig = {
  name: string;
  chainId: number;
  gateway: string;
  gasService: string;
  tokenSymbol: string;
  label: string;
};

const CHAIN_CONFIGS: ChainConfig[] = require("../../constants/axl/chain-configs.json");

async function createTransferCall({
  chainName,
  axlSuperCall,
  tokenAddress,
  recipient,
  amount,
}: {
  chainName: string;
  axlSuperCall: string;
  tokenAddress: string;
  recipient: string;
  amount: string;
}) {
  const [signer] = await ethers.getSigners();

  const gateway = IERC20__factory.connect(tokenAddress, signer);
  const callData = await gateway.interface.encodeFunctionData("transfer", [
    recipient,
    amount,
  ]);

  const call = new AxlCall(chainName, tokenAddress, callData, axlSuperCall);
  return call;
}

async function main() {
  const [signer] = await ethers.getSigners();
  const addressList = await addressUtils.getAddressList(network.name);

  const ownedAxlSuperCall = await ethers.getContractAt(
    "OwnedAxlSuperCall",
    addressList["OwnedAxlSuperCall"]
  );

  // Input
  const tokenSymbol = "aUSDC";
  const recipient = signer.address;

  // Source chain
  const sourceChain = CHAIN_CONFIGS.find((ch) => ch.label === network.name);
  if (!sourceChain) throw new Error("Source chain not found");

  const sourceAxlSuperCallAddr = addressList["OwnedAxlSuperCall"];
  const sourceTokenAddr = addressList[tokenSymbol];

  // Calculation
  const amount = ethers.parseUnits("0.5", 6).toString();

  // Root call
  const call = await createTransferCall({
    chainName: sourceChain.name,
    axlSuperCall: sourceAxlSuperCallAddr,
    tokenAddress: sourceTokenAddr,
    recipient,
    amount: amount.toString(),
  });

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
