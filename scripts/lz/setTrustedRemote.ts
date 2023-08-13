import { ethers, network } from "hardhat";
import addressUtils from "../../utils/addressUtils";
import { LzApp__factory } from "../../typechain-types";

const chainIds = require("../../constants/chainIds.json");

async function setTrustedRemotePair(srcChain: string, destChain: string, contractName: string) {
  const [signer] = await ethers.getSigners();
  const srcAddrList = await addressUtils.getAddressList(srcChain);
  const destAddrList = await addressUtils.getAddressList(destChain);

  // Input 2
  const sourceAddr = srcAddrList[contractName];
  const destAddr = destAddrList[contractName];

  const lzSuperCall = LzApp__factory.connect(sourceAddr, signer);

  const remoteChainId = chainIds[destChain];
  const remoteAndLocal = ethers.solidityPacked(
    ["address", "address"],
    [destAddr, sourceAddr]
  );

  const isTrustedRemoteSet = await lzSuperCall.isTrustedRemote(
    remoteChainId,
    remoteAndLocal
  );

  if (!isTrustedRemoteSet) {
    try {
      let tx = await (
        await lzSuperCall.setTrustedRemote(remoteChainId, remoteAndLocal)
      ).wait();
      console.log(
        `✅ [${network.name}] setTrustedRemote(${remoteChainId}, ${remoteAndLocal})`
      );
      console.log(` tx: ${tx?.hash}`);
    } catch (e: any) {
      if (
        e?.error?.message?.includes("The chainId + address is already trusted")
      ) {
        console.log("*source already set*");
      } else {
        console.log(
          `❌ [${network.name}] setTrustedRemote(${remoteChainId}, ${remoteAndLocal})`
        );
      }
    }
  } else {
    console.log("*source already set*");
  }
}

async function main() {
  const chain1 = "fantom-testnet";
  const chain2 = "fuji";
  const contractName = "LzSuperCall";
  await setTrustedRemotePair(chain1, chain2, contractName);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
