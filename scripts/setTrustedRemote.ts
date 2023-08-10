import { ethers, network } from "hardhat";
import addressUtils from "../utils/addressUtils";
import { LzSuperCall__factory } from "../typechain-types";

const chainIds = require("../constants/chainIds.json");

async function main() {
  const [signer] = await ethers.getSigners();

  const srcChain = "fuji";
  const destChain = "bsc-testnet";

  const srcAddrList = await addressUtils.getAddressList(srcChain);
  const destAddrList = await addressUtils.getAddressList(destChain);

  const lzSuperCall = LzSuperCall__factory.connect(
    srcAddrList["LzSuperCall"],
    signer
  );

  const remoteChainId = chainIds[destChain];
  const remoteAndLocal = ethers.solidityPacked(
    ["address", "address"],
    [destAddrList["LzSuperCall"], srcAddrList["LzSuperCall"]]
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
        e.error.message.includes("The chainId + address is already trusted")
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

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
