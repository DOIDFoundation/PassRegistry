
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const AHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('A'))
const BHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('B'))
const CHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('C'))

function getNameHash(name) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name))
}
  
async function mintDomain(proxy, owner, name){
      const secret = ethers.utils.formatBytes32String("secret")
      const data = []
      const commit = await proxy.makeCommitment(
          name,
          owner,
          secret,
          data
      )

      //commit
      const tx = await proxy.commit(commit)

      // register
      await proxy.register(name, owner, secret, data)
}

async function lockPass(signer, proxy, name) {
    const passId = 1
    await proxy.lockAndMint(name, signer.address)
}

module.exports = {
    ZERO_ADDRESS,
    mintDomain,
    lockPass,
    getNameHash
}