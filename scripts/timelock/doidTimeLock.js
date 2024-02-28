const hre = require('hardhat')

async function main() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log('admin:', admin.address)

  const testnet = ''
  const timelock = await hre.ethers.getContractAt('DoidTimeLock', testnet)

  // locking ETH
  const unlockTimestamp = 1709096516
  const lockAmount = 100
  let tx = await timelock.queue(unlockTimestamp, { value: lockAmount })
  console.log('debug tx', await tx.wait())

  // find out my locking info
  const info = await timelock.getQueue(admin.address)
  console.log('my locking info:', info)

  // unlock ETH after blocks
  tx = await timelock.execute()
  console.log(await tx.wait())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
