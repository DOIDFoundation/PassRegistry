// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat')

const DOID_REGISTRY_ADDRESS = {
  sepolia: '0x24256dAb379962842691Eb8bcE11f2b5032bf1b6',
  goerli: '',
  online: '',
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
