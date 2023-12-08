const hre = require('hardhat')
const { ethers } = require('ethers')
const { url } = require('inspector')

async function register() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log('admin:', admin.address)

  const contractAddress = '0xDA182b24dE5D8f36b453325Fdd8c2C1cA7C04A12'
  const proxy = await hre.ethers.getContractAt('DoidRegistry', contractAddress)

  const name = 'doidtest'
  const owner = admin.address
  const secret = ethers.utils.formatBytes32String('secret')
  const data = []
  const commit = await proxy.makeCommitment(name, owner, secret, data)

  //commit
  // const tx = await proxy.commit(commit)

  // register
  await proxy.register(name, admin.address, secret, data)

  const nameHash = await proxy.nameHash(name)
  console.log('ownerof(namehash)', await proxy.ownerOf(nameHash))
}

// upgrade contract
async function main() {
  await register()
  return
  const ftmNetwork = {
    chainId: 4002,
    ensAddress: '0xDA182b24dE5D8f36b453325Fdd8c2C1cA7C04A12',
    name: 'doidnameservicetestnetwork',
  }
  const provider = await new hre.ethers.providers.JsonRpcProvider(
    'https://rpc.testnet.fantom.network/',
    ftmNetwork,
  )
  console.log('network', provider.network)
  const r = await provider.getResolver('abc')
  console.log('resolver', r)
  console.log(
    'namehahs',
    ethers.utils.namehash(
      '5555763613a12d8f3e73be831dff8598089d3dca.addr.reverse',
    ),
  )

  if (r == null) {
    console.log('error')
    return
  }
  console.log('resolver name', r.name)
  console.log('resolver address', r.address)
  console.log('resolver avatar', await r.getAvatar())
  console.log('resolver address', await r.getAddress())
  console.log('resolver address0', await r.getAddress(0))
  console.log('resolver contentHash', await r.getContentHash())
  console.log('resolver get email', await r.getText('email'))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
