const hre = require('hardhat')
const fs = require('fs')
const readline = require('readline')
var uts46 = require('idna-uts46-hx')

const pathToHashName = 'scripts/reserveNamesHash.txt'
const pathToValidName = 'scripts/reserveNamesValid.txt'
const CONTRACT_ADDRESS = {
  doidtest: '0x20507b80c92d32DDfd733E81aF255b549421dfd8',
  ftmtest: '0x9281fD776D35f518B877D726e6a30eff1c7775E9',
  sepolia: '0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE',
  goerli: '0xF32950cf48C10431b27EFf888D23cB31615dFCb4',
  online: '0x8b2afF81fec4E7787AeeB257b5D99626651Ee43F',
  localhost: '0x8b2afF81fec4E7787AeeB257b5D99626651Ee43F',
  doid: '0xB16C6b5aCc7786E1Ff60FE9306d90f44B5562F5A',
}[hre.network.name]

async function generateNames() {
  let names = {}

  const readStream = fs.createReadStream('scripts/lockpass/reserveNames.txt')
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
  // let chars = []
  // for (var i = 48; i <= 57; ++i) chars.push(i)
  // for (var i = 97; i <= 122; ++i) chars.push(i)
  // for (let i of chars) {
  //   let c = String.fromCharCode(i)
  //   console.log(c + c)
  //   console.log(c + c + c)
  //   console.log(c + c + c + c)
  //   console.log(c + c + c + c + c)
  //   console.log(c + c + c + c + c + c)
  // }
  // for (let i of chars) {
  //   let c = String.fromCharCode(i)
  //   let d = String.fromCharCode(i + 1)
  //   let e = String.fromCharCode(i + 2)
  //   let f = String.fromCharCode(i + 3)
  //   if ((i >= 48 && i < 57) | (i >= 97 && i < 122)) console.log(c + d)
  //   if ((i >= 48 && i < 56) | (i >= 97 && i < 121)) console.log(c + d + e)
  //   if ((i >= 48 && i < 55) | (i >= 97 && i < 120)) console.log(c + d + e + f)
  // }
  // for (let i of chars) {
  //   let c = String.fromCharCode(i)
  //   let d = String.fromCharCode(i - 1)
  //   let e = String.fromCharCode(i - 2)
  //   let f = String.fromCharCode(i - 3)
  //   if ((i > 48 && i <= 57) | (i > 97 && i <= 122)) console.log(c + d)
  //   if ((i > 49 && i <= 57) | (i > 98 && i <= 122)) console.log(c + d + e)
  //   if ((i > 50 && i <= 57) | (i > 99 && i <= 122)) console.log(c + d + e + f)
  // }
  // return
  // generateNames()
  // return

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

  const proxy = await hre.ethers.getContractAt('PassRegistry', CONTRACT_ADDRESS)

  const chunkSize = 300
  const start = 0
  for (let i = start; i < hashnames.length; i += chunkSize) {
    console.log('starting', i)
    const chunk = hashnames.slice(i, i + chunkSize)
    console.log(await proxy.reserveName(chunk))
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
