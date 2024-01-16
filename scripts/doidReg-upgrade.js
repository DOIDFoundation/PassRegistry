// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat')

const DOID_REGISTRY_ADDRESS = {
  ftmtest: '0x6974201EaAEb277888F6a4028d952E6A59F0baD1',
  sepolia: '0x24256dAb379962842691Eb8bcE11f2b5032bf1b6',
  goerli: '0xAB4d8acb8538e7F2B81a8e0Db6530bBec96678b5',
  online: '0xCB9302Da98405eCc50B1D6D4F9671F05E143B5F7',
  rifftestnet: '0x4e01ea20AF674020185A01a48f25B83222f0047D', //0x6F1Daf34fE23273C3B2972B64B973efd0D6040F4
}[hre.network.name]

async function main() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log('admin:', admin.address)

  const DDNSRegistry = await hre.ethers.getContractFactory('DoidRegistry')
  const ddns = await upgrades.upgradeProxy(DOID_REGISTRY_ADDRESS, DDNSRegistry)
  console.log('upgrade proxy', ddns.address)
  await ddns.deployed()
  console.log(
    'new implementation',
    await upgrades.erc1967.getImplementationAddress(ddns.address),
  )
  await hre.run('verify:verify', {
    address: await upgrades.erc1967.getImplementationAddress(ddns.address),
  })
  return
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
