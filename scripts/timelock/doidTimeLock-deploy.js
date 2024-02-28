const hre = require('hardhat')

async function main() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log('admin:', admin.address)

  const DoidTimeLock = await hre.ethers.getContractFactory('DoidTimeLock')
  const timelock = await DoidTimeLock.deploy()
  console.log(`deploy doidTimeLock contract @${timelock.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
