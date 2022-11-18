const hre = require('hardhat')
const fs = require('fs')
const readline = require('readline')
var uts46 = require('idna-uts46-hx')

// upgrade contract
async function main() {
  const Registry = await hre.ethers.getContractFactory('PassRegistry')
  const proxy = await upgrades.upgradeProxy(
    '0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE',
    Registry,
  )

  let names = []
  let hashnames = []

  const readStream = fs.createReadStream('scripts/reserveNames.txt')
  const writeStream = fs.createWriteStream('scripts/reserveNames2.txt')

  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    let name = line.toLowerCase().replace(/[\s'&.,]+/g, '')
    if (name.length == 0) continue
    names.push(name)
    hashnames.push(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name)))
    writeStream.write(name)
    writeStream.write('\n')
    // console.log(name)
    try {
      uts46.toUnicode(name, { useStd3ASCII: true, transitional: false })
    } catch (e) {
      console.error(name, e)
    }
  }

  console.log(await proxy.estimateGas.reserveNames(hashnames))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
