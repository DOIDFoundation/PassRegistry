const hre = require('hardhat')

async function main() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log('admin:', admin.address)

  const DoidTimeLock = await hre.ethers.getContractFactory('DoidTimeLock')
  const proxy = await upgrades.deployProxy(DoidTimeLock, [])
  await proxy.deployed()

  console.log(
    `✅deploy  ${proxy.address}`
  );

  console.log(
    'implementation',
    await upgrades.erc1967.getImplementationAddress(proxy.address),
  )
  await hre.run('verify:verify', {
    address: proxy.address,
  })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
