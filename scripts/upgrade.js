const hre = require("hardhat");

// upgrade contract
async function main() {
    const Registry = await hre.ethers.getContractFactory('PassRegistry')
    const proxy = await upgrades.upgradeProxy("0xd0587d2ff8759912961c70dee6aa931547c9b0c3", Registry)
    console.log("upgrade proxy", proxy.address)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});