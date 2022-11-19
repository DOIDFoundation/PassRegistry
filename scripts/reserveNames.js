const hre = require('hardhat')
const fs = require('fs')
const readline = require('readline')
var uts46 = require('idna-uts46-hx')

const pathToHashName = 'scripts/reserveNamesHash.txt'
const pathToValidName = 'scripts/reserveNamesValid.txt'

async function generateNames() {
  let names = {}

  const readStream = fs.createReadStream('scripts/reserveNames.txt')
  const writeStream = fs.createWriteStream(pathToValidName)
  const writeHashStream = fs.createWriteStream(pathToHashName)

  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    let name = line.toLowerCase().replace(/[\s'&.,]+/g, '')
    if (name.length == 0) continue

    try {
      uts46.toUnicode(name, { useStd3ASCII: true, transitional: false })
    } catch (e) {
      console.error(name, e)
      continue
    }

    if (names[name]) continue

    names[name] = true
    // console.log(
    //   name,
    //   ethers.utils.toUtf8Bytes(name).length,
    //   ethers.utils.hexlify(ethers.utils.toUtf8Bytes(name)),
    //   parseInt(ethers.utils.hexlify(ethers.utils.toUtf8Bytes(name))),
    // )
    // continue
    let hashname = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name))
    writeStream.write(name)
    writeStream.write('\n')
    writeHashStream.write(hashname)
    writeHashStream.write('\n')
  }
  writeStream.close()
  writeHashStream.close()
}

// upgrade contract
async function main() {
  generateNames()
  return

  let names = [],
    hashnames = []

  const readStream = fs.createReadStream(pathToValidName)
  const readHashStream = fs.createReadStream(pathToHashName)

  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    names.push(line)
  }
  rl.close()
  const rlHash = readline.createInterface({
    input: readHashStream,
    crlfDelay: Infinity,
  })
  for await (const line of rlHash) {
    hashnames.push(line)
  }
  rlHash.close()

  console.log('lines:', names.length, hashnames.length)

  const Registry = await hre.ethers.getContractFactory('PassRegistry')
  const proxy = await upgrades.upgradeProxy(
    '0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE',
    Registry,
  )

  const chunkSize = 1000
  const start = 0
  for (let i = start; i < hashnames.length; i += chunkSize) {
    console.log('starting', i)
    const chunk = hashnames.slice(i, i + chunkSize)
    console.log(await proxy.estimateGas.reserveName(chunk))
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
