// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log("admin:", admin.address)

  const Registry = await hre.ethers.getContractFactory('PassRegistry')
  //const reg = await upgrades.deployProxy(Registry, [admin.address, "pass", "pass"])
  const proxy = await hre.ethers.getContractAt('PassRegistry', "0xd0587d2ff8759912961c70dee6aa931547c9b0c3")

  // create code
  const hashedMsg = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("A"))
  const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))

  //await proxy.lockPass(sig, "bob", "A")
  const sig1 = ethers.utils.toUtf8Bytes("0x01debac705ebed9d2b48316e65889af05e263bec986b9fc238febcc913f38c3b31549fcfbebead15b496bf777e289f82a113282d4a7334617c40c5bd967a020a1c")
  console.log(await proxy.estimateGas.lockPass(ethers.utils.arrayify("0x01debac705ebed9d2b48316e65889af05e263bec986b9fc238febcc913f38c3b31549fcfbebead15b496bf777e289f82a113282d4a7334617c40c5bd967a020a1c"), "bob", "A"))

  console.log(
    `✅deploy passRegistry ${reg.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
