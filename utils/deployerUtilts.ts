import { ethers } from "hardhat";
import { CreateDeployer__factory } from "../typechain-types";

// This function corresponds to the `deployedAddress` function in Solidity
export async function deployedAddress(
  deployerAddr: string,
  sender: string,
  salt: string
): Promise<string> {
  const abiCoder = new ethers.AbiCoder();
  const deploySalt = ethers.keccak256(
    abiCoder.encode(["address", "bytes32"], [sender, salt])
  );

  // You should replace DEPLOYER_BYTECODE_HASH with the actual hash
  const DEPLOYER_BYTECODE_HASH = ethers.keccak256(CreateDeployer__factory.bytecode);

  return deployedAddressCreate3(
    deployerAddr,
    deploySalt,
    DEPLOYER_BYTECODE_HASH
  );
}

// This function corresponds to `Create3.deployedAddress()`
function deployedAddressCreate3(
  deployerAddr: string,
  salt: string,
  DEPLOYER_BYTECODE_HASH: string
): string {
  const host = deployerAddr;

  const deployerAddress = ethers.getAddress(
    "0x" +
      ethers
        .toBigInt(
          ethers.keccak256(
            ethers.concat(["0xff", host, salt, DEPLOYER_BYTECODE_HASH])
          )
        )
        .toString(16)
        .slice(-40)
        .padStart(40, "0")
  );

  const deployed = ethers.getAddress(
    "0x" +
      ethers
        .toBigInt(
          ethers.keccak256(ethers.concat(["0xd694", deployerAddress, "0x01"]))
        )
        .toString(16)
        .slice(-40)
        .padStart(40, "0")
  );

  return deployed;
}