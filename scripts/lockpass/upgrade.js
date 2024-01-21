const hre = require('hardhat')

// upgrade contract
async function main() {
  const CONTRACT_ADDRESS = {
    sepolia: '0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE',
    goerli: '0xF32950cf48C10431b27EFf888D23cB31615dFCb4',
    online: '0x8b2afF81fec4E7787AeeB257b5D99626651Ee43F',
    doidtest: '0x20507b80c92d32DDfd733E81aF255b549421dfd8',
    doid: '0xB16C6b5aCc7786E1Ff60FE9306d90f44B5562F5A',
  }[hre.network.name]
  console.log('proxy address', CONTRACT_ADDRESS)
  console.log(
    'old implementation',
    await upgrades.erc1967.getImplementationAddress(CONTRACT_ADDRESS),
  )
  const Registry = await hre.ethers.getContractFactory('PassRegistry')
  const proxy = await upgrades.upgradeProxy(CONTRACT_ADDRESS, Registry)
  console.log('upgrade proxy', proxy.address)
  await proxy.deployed()
  console.log(
    'new implementation',
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
