// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const PASS_REGISTRY = ""
const TEST_PASS_REGISTRY = "0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE"

async function main() {
  if (false){
    const DDNSRegistry = await hre.ethers.getContractFactory('DoidRegistry')
    const ddns = await upgrades.upgradeProxy("0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE", DDNSRegistry)
    console.log("upgrade proxy", ddns.address)
    return
  }
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log("admin:", admin.address)

  const DoidRegistry = await hre.ethers.getContractFactory('DoidRegistry')
  const proxy = await upgrades.deployProxy(DoidRegistry, [TEST_PASS_REGISTRY, 60, 86400])
  await proxy.deployed()
  //const proxy = await hre.ethers.getContractAt('DoidRegistry', "0x43Eb9Fa1D47d17c94285C3D859A14060dc9a2c47")

  console.log(
    `✅deploy DoidRegistry ${proxy.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
