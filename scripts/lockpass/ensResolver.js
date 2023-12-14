const hre = require('hardhat')
const { ethers, utils } = require('ethers')

async function register_dns(proxy, admin) {
  const name = 'doidtest'
  // register
  console.log('register', name, admin.address)
  await proxy['register(string,address)'](name, admin.address)
}

// upgrade contract
async function main() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log('admin:', admin.address)

  // const contractAddress = '0x3d0E88068863407ffb073F9D020F7d2E8788ee22'
  const contractAddress = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
  const proxy = await hre.ethers.getContractAt('DoidRegistry', contractAddress)

  const register = false
  if (register) {
    await register_dns(proxy, admin)
    return
  }
  const ftmTestProvider = await new ethers.providers.JsonRpcProvider(
    'https://rpc.testnet.fantom.network/',
    {
      chainId: 4002,
      ensAddress: contractAddress,
      name: 'doidtest',
    },
  )
  // localhost provider
  const provider = await new ethers.providers.JsonRpcProvider(
    'http://127.0.0.1:8545',
    {
      chainId: 31337,
      ensAddress: contractAddress,
      name: 'doidtest.doid',
    },
  )
  console.log('network', provider.network)

  const name = 'doidtest.doid'
  // const hash = await proxy.nameHash(name)
  // console.log(`contract namehash(${name}`, hash)
  // console.log(`contract namehash(doidtest)`, await proxy.nameHash('doidtest'))
  // console.log('contract addr', await proxy.addr(hash))
  // console.log(
  //   'utils namehash(doidtest.doid)',
  //   ethers.utils.namehash('doidtest.doid'),
  // )
  // console.log(
  //   'utils namehash(doidtest.doid.eth)',
  //   ethers.utils.namehash('doidtest.doid.eth'),
  // )
  // console.log(
  //   'utils namehash(doidtest.eth)',
  //   ethers.utils.namehash('doidtest.eth'),
  // )
  // console.log('utils namehash(doidtest)', ethers.utils.namehash('doidtest'))
  // console.log('utils namehash(doid)', ethers.utils.namehash('doid'))
  // console.log('namehash(addr.reverse)', ethers.utils.namehash('addr.reverse'))

  // use ethersjs to lookup address of name , and resolveName
  console.log(
    'lookupAddress()',
    await provider.lookupAddress(admin.address),
    'resolveName()',
    await provider.resolveName(name),
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
