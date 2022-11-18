const hre = require('hardhat')

// upgrade contract
async function main() {
  const Registry = await hre.ethers.getContractFactory('PassRegistry')
  const proxy = await upgrades.upgradeProxy(
    '0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE',
    Registry,
  )

  let names = [
    ""
  ]
  let hashnames = []
  names.forEach(element => {
    hashnames.push(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(element)))
  });

  console.log(await proxy.estimateGas.reserveNames(hashnames))

}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
