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
          //console.log(tx.events)
          
        })
    })

    describe("LockName", function(){
      it("", async function() {

      })
    })

    describe("Name available", function(){
      it("invalid name length", async function() {
        expect(await proxy.lenValid(2, "c")).to.equals(false)
        expect(await proxy.lenValid(2, "1")).to.equals(false)
        expect(await proxy.lenValid(2, ".")).to.equals(false)
        expect(await proxy.lenValid(2, "测")).to.equals(false)
        expect(await proxy.lenValid(3, "ab")).to.equals(false)
        expect(await proxy.lenValid(4, "abc")).to.equals(false)
      })
      it("valid name length", async function() {
        expect(await proxy.lenValid(2, "12")).to.equals(true)
        expect(await proxy.lenValid(2, "123")).to.equals(true)
        expect(await proxy.lenValid(2, "ab")).to.equals(true)
        expect(await proxy.lenValid(2, "abc")).to.equals(true)
        expect(await proxy.lenValid(2, "测试")).to.equals(true)
        expect(await proxy.lenValid(2, "测试1")).to.equals(true)
        expect(await proxy.lenValid(3, "测试1")).to.equals(true)
        expect(await proxy.lenValid(4, "测试12")).to.equals(true)
      })

      it("in denylist" ,async function() {

      })

      it("not in denylist" ,async function() {
      })

      it("dup name", async function(){

      })
      it("name max_length=64", async function(){
        expect(await proxy.lenValid(2, "1111111111111111111111111111111111111111111111111111111111111111")).to.equals(true)
        expect(await proxy.lenValid(2, "11111111111111111111111111111111111111111111111111111111111111111")).to.equals(false)
      })
    })
  })