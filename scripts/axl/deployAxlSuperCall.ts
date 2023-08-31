import { ethers, network } from "hardhat";
import addressUtils from "../../utils/addressUtils";

type ChainConfig = {
  name: string;
  chainId: number;
  gateway: string;
  gasService: string;
  label: string;
};

const CHAIN_CONFIGS: ChainConfig[] = require("../../constants/axl/chain-configs.json");

function getDeploymentSalt(key: string) {
  const abiCoder = new ethers.AbiCoder();
  const salt = ethers.keccak256(abiCoder.encode(["string"], [key.toString()]));
  return salt;
}

async function main() {
  const addressList = await addressUtils.getAddressList(network.name);

  const [signer] = await ethers.getSigners();

  const deployer = await ethers.getContractAt(
    "Create3Deployer",
    addressList["Create3Deployer"]
  );

  // Args
  const chainConfig = CHAIN_CONFIGS.find(
    (config) => config.label === network.name
  );
  if (!chainConfig) throw new Error("Chain config not found");

  const chain = chainConfig.name;
  const gateway = chainConfig.gateway;
  const gasReceiver = chainConfig.gasService;

  // Preparation
  const factory = await ethers.getContractFactory("AxlSuperCall");
  const bytecode = await factory
    .getDeployTransaction(gateway, gasReceiver, chain)
    .then((tx) => tx.data);
    
  const key = Math.random().toString(36).substring(7);
  const salt = getDeploymentSalt(key);

  const tx = await deployer.deploy(bytecode, salt);
  await tx.wait();

  const deployedAddress = await deployer.deployedAddress(signer.address, salt);
  console.log("AxlSuperCall deployed at", deployedAddress);

  await addressUtils.saveAddresses(network.name, {
    AxlSuperCall: deployedAddress,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
