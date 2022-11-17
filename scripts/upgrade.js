const hre = require('hardhat')

// upgrade contract
async function main() {
  const Registry = await hre.ethers.getContractFactory('PassRegistry')
  const proxy = await upgrades.upgradeProxy(
    '0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE',
    Registry,
  )
  console.log('upgrade proxy', proxy.address)
  console.log(
    'implementation',
    await upgrades.erc1967.getImplementationAddress(proxy.address),
  )
  await hre.run('verify:verify', {
    address: await upgrades.erc1967.getImplementationAddress(proxy.address),
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
