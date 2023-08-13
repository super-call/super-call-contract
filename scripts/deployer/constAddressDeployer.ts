import { ethers } from 'hardhat';
import { ConstAddressDeployer } from '../../typechain-types';

const getSaltFromKey = (key: string) => {
  return keccak256(defaultAbiCoder.encode(['string'], [key.toString()]));
};

const estimateGasForDeploy = async (deployer: ConstAddressDeployer, contractJson: any, args = []) => {
  const salt = getSaltFromKey('');
  const factory = new ContractFactory(contractJson.abi, contractJson.bytecode);
  const bytecode = factory.getDeployTransaction(...args).data;
  return await deployer.estimateGas.deploy(bytecode, salt);
};

const estimateGasForDeployAndInit = async (
  deployer,
  wallet,
  contractJson,
  args = [],
  initArgs = [],
) => {
  const salt = getSaltFromKey('');
  const factory = new ContractFactory(contractJson.abi, contractJson.bytecode);
  const bytecode = factory.getDeployTransaction(...args).data;

  const address = await deployer.deployedAddress(
    bytecode,
    wallet.address,
    salt,
  );
  const contract = new Contract(address, contractJson.abi, wallet);
  const initData = (await contract.populateTransaction.init(...initArgs)).data;
  return await deployer.estimateGas.deployAndInit(bytecode, salt, initData);
};

const deployContractConstant = async (
  deployerAddress,
  wallet,
  contractJson,
  key,
  args = [],
  gasLimit = null,
) => {
  const deployer = new Contract(
    deployerAddress,
    ConstAddressDeployer.abi,
    wallet,
  );
  const salt = getSaltFromKey(key);
  const factory = new ContractFactory(contractJson.abi, contractJson.bytecode);
  const bytecode = factory.getDeployTransaction(...args).data;
  const tx = await deployer
    .connect(wallet)
    .deploy(bytecode, salt, { gasLimit });
  await tx.wait();
  const address = await deployer.deployedAddress(
    bytecode,
    wallet.address,
    salt,
  );
  return new Contract(address, contractJson.abi, wallet);
};

const deployAndInitContractConstant = async (
  deployerAddress,
  wallet,
  contractJson,
  key,
  args = [],
  initArgs = [],
  gasLimit = null,
) => {
  const deployer = new Contract(
    deployerAddress,
    ConstAddressDeployer.abi,
    wallet,
  );
  const salt = getSaltFromKey(key);
  const factory = new ContractFactory(contractJson.abi, contractJson.bytecode);
  const bytecode = factory.getDeployTransaction(...args).data;
  const address = await deployer.deployedAddress(
    bytecode,
    wallet.address,
    salt,
  );
  const contract = new Contract(address, contractJson.abi, wallet);
  const initData = (await contract.populateTransaction.init(...initArgs)).data;
  const tx = await deployer
    .connect(wallet)
    .deployAndInit(bytecode, salt, initData, {
      gasLimit,
    });
  await tx.wait();
  return contract;
};

const predictContractConstant = async (
  deployerAddress,
  wallet,
  contractJson,
  key,
  args = [],
) => {
  const deployer = new Contract(
    deployerAddress,
    ConstAddressDeployer.abi,
    wallet,
  );
  const salt = getSaltFromKey(key);

  const factory = new ContractFactory(contractJson.abi, contractJson.bytecode);
  const bytecode = factory.getDeployTransaction(...args).data;
  return await deployer.deployedAddress(bytecode, wallet.address, salt);
};

module.exports = {
  estimateGasForDeploy,
  estimateGasForDeployAndInit,
  deployContractConstant,
  deployAndInitContractConstant,
  predictContractConstant,
};
