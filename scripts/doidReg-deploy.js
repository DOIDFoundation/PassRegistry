// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat')

const PASS_REGISTRY_ADDRESS = {
  doidtest: '0x20507b80c92d32DDfd733E81aF255b549421dfd8',
  ftmtest: '0x9281fD776D35f518B877D726e6a30eff1c7775E9',
  sepolia: '0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE',
  goerli: '0xF32950cf48C10431b27EFf888D23cB31615dFCb4',
  online: '0x8b2afF81fec4E7787AeeB257b5D99626651Ee43F',
  localhost: '0x8b2afF81fec4E7787AeeB257b5D99626651Ee43F',
  doid: '0xB16C6b5aCc7786E1Ff60FE9306d90f44B5562F5A',
}[hre.network.name]

async function main() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log('admin:', admin.address)

  const DoidRegistry = await hre.ethers.getContractFactory('DoidRegistry')
  const proxy = await upgrades.deployProxy(DoidRegistry, [
    PASS_REGISTRY_ADDRESS,
    60,
    86400,
  ])
  console.log(`✅deploy DoidRegistry ${proxy.address}`)
  await proxy.deployed()

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
