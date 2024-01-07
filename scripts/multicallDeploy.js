const hre = require('hardhat')

async function main() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log('admin:', admin.address)

  const multicall = await hre.ethers.deployContract('Multicall3')
  await multicall.waitForDeployment()
  console.log('address:', await multicall.getAddress())

  await hre.run('verify:verify', {
    address: await multicall.getAddress(),
  })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
