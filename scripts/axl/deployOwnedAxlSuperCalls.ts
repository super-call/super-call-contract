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
  const [signer] = await ethers.getSigners();

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
  const chains = ["fuji", "mumbai", 'fantom-testnet', 'bsc-testnet'];

  // Common params
  const salt = getDeploymentSalt();
  console.log("Salt: ", salt)

  // Check source OwnedAxlSuperCall address
  const sourceOwnedSuperCallAddr = chains.includes(network.name)
    ? await deployedAddress(
        addressList["Create3Deployer"],
        addressList["AxlSuperCall"],
        salt
      )
    : addressList["OwnedAxlSuperCall"];
  console.log("Source OwnedAxlSuperCall address: ", sourceOwnedSuperCallAddr);

  const promises = chains.map(async (targetChain) => {
    // Contract address
    const addresses = await addressUtils.getAddressList(targetChain);

    // Chain
    const chainConfig = CHAIN_CONFIGS.find(
      (config) => config.label === targetChain
    );
    if (!chainConfig) throw new Error("Chain config not found");
    const chainName = chainConfig.name;
    const gateway = chainConfig.gateway;
    const gasService = chainConfig.gasService;

    // Dployer Adddess
    const deployerAddress = addresses["Create3Deployer"];
    if (!deployerAddress) throw new Error("Deployer address not found");

    // CallData
    const factory = await ethers.getContractFactory("OwnedAxlSuperCall");
    const bytecode = await factory
      .getDeployTransaction(gateway, gasService, chainName)
      .then((tx) => tx.data);
    const init = await factory.interface.encodeFunctionData("init", [
      signer.address,
      sourceChain.name,
      sourceOwnedSuperCallAddr,
    ]);
    const callData = await deployer.interface.encodeFunctionData(
      "deployAndInit",
      [bytecode, salt, init]
    );

    // SuperCall Address
    const axlSuperCall = addresses["AxlSuperCall"];
    if (!axlSuperCall) throw new Error("SuperCall address not found");

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

  console.log("Fee: ", ethers.formatEther(fee));

  const tx = await axlSuperCall.aggregate(encodedCalls, { value: fee });
  console.log("Submit tx to: ", tx.hash);

  const saveAddresses = chains.map(async (targetChain) => {
    // Contract address
    const addresses = await addressUtils.getAddressList(targetChain);
    const address = await deployedAddress(
      addresses["Create3Deployer"],
      addresses["AxlSuperCall"],
      salt
    );
    await addressUtils.saveAddresses(targetChain, {
      OwnedAxlSuperCall: address,
    });

    console.log(`Saved OwnedAxlSuperCall address to ${targetChain}: `, address)
  });

  await Promise.all(saveAddresses);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
