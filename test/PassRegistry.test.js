//const {
//    time,
//    loadFixture,
//  } = require("@nomicfoundation/hardhat-network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");
  const { expect } = require("chai");
const hre = require("hardhat");
  
  describe("PassRegistry", function () {
    let proxy;
    let admin, bob, carl;
    const INVITER_ROLE = web3.utils.soliditySha3('INVITER_ROLE')
    
    beforeEach(async function () {
      const accounts = await hre.ethers.getSigners()
      admin = accounts[0]
      bob = accounts[1]
      carl = accounts[2]
      const PassRegistry = await hre.ethers.getContractFactory("PassRegistry")
      proxy = await upgrades.deployProxy(PassRegistry, [admin.address , "pass", "pass"])
      await proxy.grantRole(INVITER_ROLE,admin.address)
    })

    describe("LockPass", function() {
        it("use A invitation code from foundation", async function () {
          const className="A"
          const hashedMsg = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(className))
          const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
          // console.log(sig)
          
          await expect(proxy.lockPass(sig, "", className))
            .not.to.be.reverted

          expect(await proxy.balanceOf(admin.address)).to.equals(6)
        })
        it("use B invitation code from foundation", async function () {
          const className="B"
          const hashedMsg = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(className))
          const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
          // console.log(sig)
          
          await expect(proxy.lockPass(sig, "", className))
            .not.to.be.reverted

          expect(await proxy.balanceOf(admin.address)).to.equals(6)
        })
        it("use C invitation code from foundation", async function () {
          const className="C"
          const hashedMsg = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(className))
          const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
          // console.log(sig)
          
          await expect(proxy.lockPass(sig, "", className))
            .not.to.be.reverted

          expect(await proxy.balanceOf(admin.address)).to.equals(1)
        })

        it("using a C type invitation code from user", async function(){
          const AHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("A"))
          let sig = await admin.signMessage(ethers.utils.arrayify(AHash))
          // bob lock A pass
          await expect(proxy.connect(bob).lockPass(sig, "", "A"))
            .not.to.be.reverted;

          // bob sign a C invitation code
          const CHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("C"))
          const bobsCode = await bob.signMessage(ethers.utils.arrayify(CHash))

          // cannot use if name is not locked
          await expect(proxy.connect(carl).lockPass(bobsCode, "", "C"))
            .to.be.revertedWith("IC");
          
          // bob should lockName first
          await expect(proxy.connect(bob).lockName(1, "bob"))
          await expect(proxy.connect(carl).lockPass(bobsCode, "", "C"))
            .not.to.be.reverted;
        })

        it("invitation code from foundation can be used only once", async function () {
          const accounts = await hre.ethers.getSigners()
          const hashedMsg = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("A"))
          await proxy.grantRole(INVITER_ROLE,accounts[3].address)
          const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
          const sig2 = await accounts[3].signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("B"))))
          const sig3 = await accounts[3].signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("C"))))
          const sig4 = await accounts[4].signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("C"))))
          
          await expect(proxy.lockPass(sig, "", "A"))
            .not.to.be.reverted
          await expect(proxy.lockPass(sig, "", "A"))
            .to.be.reverted

          await expect(proxy.lockPass(sig2, "", "B"))
            .not.to.be.reverted
          await expect(proxy.lockPass(sig2, "", "B"))
            .to.be.reverted
          await expect(proxy.lockPass(sig3, "", "C"))
            .to.be.reverted

          await expect(proxy.lockPass(sig4, "", "C"))
            .to.be.reverted
        })

        it("invitation code from user can only be class C", async function () {
          const hashedMsg = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("A"))
          const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
          await expect(proxy.connect(bob).lockPass(sig, "test", "A"))
            .not.to.be.reverted

          const sig2 = await bob.signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("A"))))
          const sig3 = await bob.signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("B"))))
          const sig4 = await bob.signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("C"))))
          
          await expect(proxy.connect(carl).lockPass(sig2, "", "A"))
            .to.be.revertedWith('IC')
          await expect(proxy.connect(carl).lockPass(sig3, "", "B"))
            .to.be.revertedWith('IC')
          await expect(proxy.connect(carl).lockPass(sig4, "", "C"))
            .not.to.be.reverted
        })

        it("user can get 18 invitations from class A", async function () {
          const accounts = await hre.ethers.getSigners()
          const limit=["A",18]
          const sig = await admin.signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(limit[0]))))
          await proxy.connect(accounts[1]).lockPass(sig, "test", limit[0])
          expect((await proxy.getUserInvitedNumber(accounts[1].address))[1]).to.equals(limit[1])
          const sig2 = await accounts[1].signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("C"))))
          for (i=1;i<=limit[1];i++) {
            await expect(proxy.connect(accounts[i+1]).lockPass(sig2, "", 'C'), 'class '+limit[0]+' at '+i+'/'+limit[1])
            .not.to.be.reverted
          }
          
          await expect(proxy.connect(accounts[limit[1]]).lockPass(sig2, "",'C'), 'class '+limit[0]+' at ' +(limit[1]+1))
            .to.be.reverted
        })

        it("user can get 18 invitations from class B", async function () {
          const accounts = await hre.ethers.getSigners()
          const limit=["B",18]
          const sig = await admin.signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(limit[0]))))
          await proxy.connect(accounts[1]).lockPass(sig, "test", limit[0])
          expect((await proxy.getUserInvitedNumber(accounts[1].address))[1]).to.equals(limit[1])
          const sig2 = await accounts[1].signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("C"))))
          for (i=1;i<=limit[1];i++) {
            await expect(proxy.connect(accounts[i+1]).lockPass(sig2, "", 'C'), 'class '+limit[0]+' at '+i+'/'+limit[1])
            .not.to.be.reverted
          }
          
          await expect(proxy.connect(accounts[limit[1]]).lockPass(sig2, "",'C'), 'class '+limit[0]+' at ' +(limit[1]+1))
            .to.be.reverted
        })

        it("user can get 3 invitations from class C", async function () {
          const accounts = await hre.ethers.getSigners()
          const limit=["C",3]
          const sig = await admin.signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(limit[0]))))
          await proxy.connect(accounts[1]).lockPass(sig, "testtt", limit[0])
          expect((await proxy.getUserInvitedNumber(accounts[1].address))[1]).to.equals(limit[1])
          const sig2 = await accounts[1].signMessage(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("C"))))
          for (i=1;i<=limit[1];i++) {
            await expect(proxy.connect(accounts[i+1]).lockPass(sig2, "", 'C'), 'class '+limit[0]+' at '+i+'/'+limit[1])
            .not.to.be.reverted
          }
          
          await expect(proxy.connect(accounts[limit[1]]).lockPass(sig2, "",'C'), 'class '+limit[0]+' at ' +(limit[1]+1))
            .to.be.reverted
        })
    })

    describe("LockName", function(){
      it("lock name with passid", async function() {
          const classHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("A"))
          signature = await admin.signMessage(ethers.utils.arrayify(classHash))
          await expect(proxy.lockPass(signature, "", "A"))
            .not.to.be.reverted;

          let passId = 1
          // 1 * A pass
          await expect(proxy.lockName(passId, "a"))
            .to.be.revertedWith("IV")
          await expect(proxy.lockName(passId, "ab"))
            .to.emit(proxy, "LockName")
            .withArgs(admin.address, passId, "ab")
          
          // 6 * C pass
          passId = 2
          await expect(proxy.lockName(passId, "ab"))
            .to.be.revertedWith("IV")
          await expect(proxy.lockName(passId, "abcde"))
            .to.be.revertedWith("IV")
          await expect(proxy.lockName(passId, "abcdef"))
            .to.emit(proxy, "LockName")
            .withArgs(admin.address, passId, "abcdef")

          // not owned passid
          passId = 3 
          await proxy.transferFrom(admin.address, bob.address, 3)
          await expect(proxy.lockName(passId, "abcde"))
            .to.be.revertedWith("IP")
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