import { ethers, network } from "hardhat";
import addressUtils from "../../utils/addressUtils";
import { AxlCall } from "@super-call/sdk";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";
import { deployedAddress } from "../../utils/deployerUtilts";

type ChainConfig = {
  name: string;
  chainId: number;
  gateway: string;
  gasService: string;
  tokenSymbol: string;
  label: string;
};

const CHAIN_CONFIGS: ChainConfig[] = require("../../constants/axl/chain-configs.json");

function getDeploymentSalt() {
  const key = Math.random().toString(36).substring(7);
  const abiCoder = new ethers.AbiCoder();
  const salt = ethers.keccak256(abiCoder.encode(["string"], [key.toString()]));
  return salt;
}

async function main() {
  const addressList = await addressUtils.getAddressList(network.name);

  const deployer = await ethers.getContractAt(
    "Create3Deployer",
    addressList["Create3Deployer"]
  );

  const axlSuperCall = await ethers.getContractAt(
    "AxlSuperCall",
    addressList["AxlSuperCall"]
  );

  // Init AXL API
  const axlAPI = new AxelarQueryAPI({ environment: Environment.TESTNET });

  // Source chain
  const sourceChain = CHAIN_CONFIGS.find((ch) => ch.label === network.name);
  if (!sourceChain) throw new Error("Source chain not found");

  // Input
  const chains = ['fantom-testnet', 'mumbai', 'bsc-testnet'];

  // Common params
  const salt = getDeploymentSalt();

  const promises = chains.map(async (targetChain) => {
    // Contract address
    const addresses = await addressUtils.getAddressList(targetChain);

    // Chain
    const chainConfig = CHAIN_CONFIGS.find(
      (config) => config.label === targetChain
    );
    if (!chainConfig) throw new Error("Chain config not found");
    const chain = chainConfig.name;

    // Dployer Adddess
    const deployerAddress = addresses["Create3Deployer"];
    if (!deployerAddress) throw new Error("Deployer address not found");

    // CallData
    const factory = await ethers.getContractFactory("Logger");
    const bytecode = await factory.getDeployTransaction().then((tx) => tx.data);
    const callData = await deployer.interface.encodeFunctionData("deploy", [
      bytecode,
      salt,
    ]);

    // SuperCall Address
    const axlSuperCall = addresses["AxlSuperCall"];
    if (!axlSuperCall) throw new Error("SuperCall address not found");

    const fee = (targetChain === sourceChain.label) ? "0" : await axlAPI.estimateGasFee(
      sourceChain.name.toUpperCase(),
      chain.toUpperCase(),
      sourceChain.tokenSymbol
    );

    console.log(`Fee of ${chain}: `, ethers.formatEther(fee as string))

    const call = new AxlCall(
      chain,
      deployerAddress,
      callData,
      axlSuperCall,
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

  console.log("Fee: ", ethers.formatEther(fee))

  const tx = await axlSuperCall.aggregate(encodedCalls, { value: fee });
  console.log("Submit tx to: ", tx.hash);

  chains.forEach(async (targetChain) => {
    // Contract address
    const addresses = await addressUtils.getAddressList(targetChain);
    const address = await deployedAddress(addresses['Create3Deployer'], addresses["AxlSuperCall"], salt);
    console.log(`${targetChain}: Deployed address: `, address);
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
