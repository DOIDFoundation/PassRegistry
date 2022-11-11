//const {
//    time,
//    loadFixture,
//  } = require("@nomicfoundation/hardhat-network-helpers");
  //const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
const hre = require("hardhat");
  
  describe("PassRegistry", function () {
    let proxy;
    let admin;

    async function deployFixture() {
      const accounts = await hre.ethers.getSigners()
      admin = accounts[0]
      console.log("admin:", admin.address)
      const PassRegistry = await hre.ethers.getContractFactory("PassRegistry")
      proxy = await upgrades.deployProxy(PassRegistry, [admin.address , "pass", "pass"])

    }

    describe("Deployment", function (){
        it("initialize", async function() {
        })
    })

    describe("LockPass", function() {
        it("lockPass, without bound name, only mint 7 passes, no locking", async function () {
          await deployFixture()

          const hashedMsg = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("A"))
          sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
          
          tx = await (await proxy.lockPass(sig, "", "A")).wait()
          console.log(tx.events)
          
        })
    })
  })