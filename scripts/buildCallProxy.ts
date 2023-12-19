import { ethers, network } from "hardhat";
import addressUtils from "../utils/addressUtils";
import { Multicall3__factory } from "../typechain-types";
import { IERC20__factory } from "../typechain-types/factories/contracts/LendingContract.sol";

async function main() {
    const [signer] = await ethers.getSigners();

    const contractAddress = "0xd50aD174D6F4a2A17eDC1aFf5FA3c3fC84F661e8";
    // const proxyMulticall = Multicall3__factory.connect(contractAddress, signer);
    const proxyMulticall = new ethers.Contract(contractAddress, Multicall3__factory.abi, signer)

    const tokenContract = "0xAdcF3c517BD821EaC5576095766e5e363dd441e5";
    const amount = ethers.parseEther("100");
    const token = IERC20__factory.connect(tokenContract, signer);

    const to = "0xe87b15cCA8982d5B4121765e439d91F57C14F8c1"
    const transferCallData = token.interface.encodeFunctionData("transfer", [to, amount])

    // const abiCoder = new ethers.AbiCoder();
    // const call = abiCoder.encode(["tuple(address target, bytes callData)"], [{target: tokenContract, callData: transferCallData}]);
    const call = {target: tokenContract, callData: transferCallData}

    console.log(call)

    // const tx = await proxyMulticall.aggregate([call]);
    // console.log(tx.hash);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
