const hre = require('hardhat')

// upgrade contract
async function main() {
  const CONTRACT_ADDRESS =
    // '0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE' //Sepolia
    // '0xF32950cf48C10431b27EFf888D23cB31615dFCb4' //Goerli
    '0x8b2afF81fec4E7787AeeB257b5D99626651Ee43F' // Mainnet
  const AHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('A'))
  const INVITER_ROLE = web3.utils.soliditySha3('INVITER_ROLE')
  const proxy = await hre.ethers.getContractAt('PassRegistry', CONTRACT_ADDRESS)
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  // await (await proxy.grantRole(INVITER_ROLE, admin.address)).wait()
  // await proxy.lockPass(
  //   '0x17daebf54be9eab8fb65ff5c6cfba87c9aa04885761a3ad2ae9192562da0f3895caf593f1ab88bb3533c4cb4c5cbfcd0e3537660a7816a530ddf9ff7bfc0e03b1c',
  //   'abc',
  //   AHash,
  //   0x3e8,
  // )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
