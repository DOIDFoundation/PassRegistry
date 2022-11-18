const hre = require("hardhat");

async function generate_codes() {
  const AHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('A'))
  console.log("class A Hash", AHash)
  const BHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('B'))
  console.log("class B Hash", BHash)
  const CHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('C'))
  console.log("class C Hash", CHash)

  let passId = 1000
  const classes = [[AHash, "A"], [BHash, "B"], [CHash,"C"] ]
  for (let i = 0; i < classes.length; i++) {
    const classHash = classes[i][0]
    console.log("---------class sig---------")
    for (let index = passId; index < passId+5; index++) {
      const hashedMsg = ethers.utils.keccak256(
        ethers.utils.solidityPack(['uint256', 'bytes32'], [index, classHash]),
      )
      const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
      console.log("sig:",sig + classes[i][1] + (index).toString(16))
    }
    passId += 5
  };
}

async function main() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log("admin:", admin.address)

  const Registry = await hre.ethers.getContractFactory('PassRegistry')
  const proxy = await hre.ethers.getContractAt('PassRegistry', "0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE")

  await generate_codes()
//
//  //await proxy.lockPass(sig, "bob", "A")
//  const sig1 = ethers.utils.toUtf8Bytes("0x01debac705ebed9d2b48316e65889af05e263bec986b9fc238febcc913f38c3b31549fcfbebead15b496bf777e289f82a113282d4a7334617c40c5bd967a020a1c")
//  console.log(await proxy.estimateGas.lockPass(ethers.utils.arrayify("0x01debac705ebed9d2b48316e65889af05e263bec986b9fc238febcc913f38c3b31549fcfbebead15b496bf777e289f82a113282d4a7334617c40c5bd967a020a1c"), "bob", "A"))

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});