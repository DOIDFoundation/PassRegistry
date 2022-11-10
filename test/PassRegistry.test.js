//const {
//    time,
//    loadFixture,
//  } = require("@nomicfoundation/hardhat-network-helpers");
  //const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  //const { expect } = require("chai");
const hre = require("hardhat");
  
  describe("PassRegistry", function () {
    let proxy;

    async function deployFixture() {
      const PassRegistry = await hre.ethers.getContractFactory("PassRegistry")
      proxy = await upgrades.deployProxy(PassRegistry, ["pass", "pass"]);

    }

    describe("Deployment", function (){
        it("initialize", async function() {
        })
    })

    describe("LockPass", function() {
        it("lockPass, without bound name", async function () {
          await deployFixture()
          
        })
    })
  })