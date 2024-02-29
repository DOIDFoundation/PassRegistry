const hre = require('hardhat')

const contract_address = {
  doidtest: '0x4cAe3adCae50Bd33Ad700d96e7f6430E0f4b3d53',
  // sepolia: '0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE',
  // goerli: '0xF32950cf48C10431b27EFf888D23cB31615dFCb4',
  // online: '0x8b2afF81fec4E7787AeeB257b5D99626651Ee43F',
  // doid: '0x8b2afF81fec4E7787AeeB257b5D99626651Ee43F',
}[hre.network.name]

async function main() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log('admin:', admin.address)

  const timelock = await hre.ethers.getContractAt(
    'DoidTimeLock',
    contract_address,
  )

  // locking ETH
  const unlockTimestamp = 1711691760
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
