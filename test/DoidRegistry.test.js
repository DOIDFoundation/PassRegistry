require('@nomicfoundation/hardhat-chai-matchers')
const {BigNumber, utils} = require("ethers")
const { expect } = require('chai')
const hre = require('hardhat')
const { mintDomain, lockPass, ZERO_ADDRESS, getNameHash } = require('./helpers')

const INVITER_ROLE = web3.utils.soliditySha3('INVITER_ROLE')
const DEFAULT_COIN_TYPE = 60

describe('DoidRegistry', function () {
  let proxy, passReg
  let admin, bob, carl

  beforeEach(async function () {
    const accounts = await hre.ethers.getSigners()
    admin = accounts[0]
    bob = accounts[1]
    carl = accounts[2]
    const PassReg = await hre.ethers.getContractFactory("PassRegistry")
    passReg = await upgrades.deployProxy(PassReg, [admin.address, "pass", "pas"])
    await passReg.grantRole(INVITER_ROLE, admin.address)

    const DoidRegistry = await hre.ethers.getContractFactory('DoidRegistry')
    proxy = await upgrades.deployProxy(DoidRegistry, [
        passReg.address,
        0,
        86400
    ])
    await passReg.setDoidRegistry(proxy.address)
  })



  describe('Registry', () => {
    it('registry by commit', async () => {
        const name = "doidtest"
        const owner = admin.address
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
        await proxy.register(name, admin.address, secret, data)

        const nameHash = await proxy.nameHash(name)
        expect(await proxy.ownerOf(nameHash)).to.be.equals(admin.address)
    })

    it('register a name twice', async () => {
        const name = "doidtest"
        const owner = admin.address
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
        await proxy.register(name, admin.address, secret, data)

        const nameHash = await proxy.nameHash(name)
        expect(await proxy.ownerOf(nameHash)).to.be.equals(admin.address)

        // dup name
        await proxy.commit(commit)
        await expect(proxy.register(name, admin.address, secret, data)).to.be.revertedWith("IN")
    })

    it('wrong commitment secret', async () => {
        const name = "doidtest"
        const owner = admin.address
        const secret = ethers.utils.formatBytes32String("secret")
        const secretwrong = ethers.utils.formatBytes32String("secretwrong")
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
        await expect(proxy.register(name, admin.address, secretwrong, data)).to.be.revertedWith("CO")
        await expect(proxy.register(name, admin.address, secret, data)).to.ok

        const nameHash = await proxy.nameHash(name)
        expect(await proxy.ownerOf(nameHash)).to.be.equals(admin.address)
    })

    it("register from pass.claimDoid()", async () => {
        let name = "aabbcc"
        await lockPass(admin, passReg, name)
        await expect(proxy.claimLockedName(name,admin.address)).to.be.revertedWith("Excuted by PassRegistry only")
        await passReg.claimDoid(100001)
        expect(await proxy.ownerOf(await proxy.nameHash(name))).to.be.equals(admin.address)
        name = "aabb"
        await lockPass(admin, passReg, name)
        await expect(proxy.claimLockedName(name,admin.address)).to.be.revertedWith("Excuted by PassRegistry only")
        await passReg.claimDoid(100002)
        expect(await proxy.ownerOf(await proxy.nameHash(name))).to.be.equals(admin.address)
        name = "aa"
        await lockPass(admin, passReg, name)
        await expect(proxy.claimLockedName(name,admin.address)).to.be.revertedWith("Excuted by PassRegistry only")
        await passReg.claimDoid(100003)
        expect(await proxy.ownerOf(await proxy.nameHash(name))).to.be.equals(admin.address)
        //console.log(await proxy.addr(await proxy.nameHash(name), DEFAULT_COIN_TYPE))
        name = "bb"
        await lockPass(admin, passReg, name)
        await mintDomain(proxy, admin.address, name)
        await expect(proxy.claimLockedName(name,admin.address)).to.be.revertedWith("Excuted by PassRegistry only")
        await expect(passReg.claimDoid(100004)).to.be.rejectedWith("IN")
        expect(await proxy.ownerOf(await proxy.nameHash(name))).to.be.equals(admin.address)
    })

    it("register a locked name", async() => {
      const name = "testname123"
      await lockPass(bob, passReg, name)
      const secret = ethers.utils.formatBytes32String("secret")
      const commit = await proxy.makeCommitment(
          name,
          admin.address,
          secret,
          []
      )

      await expect(proxy.commit(commit)).not.to.be.reverted
      await expect(proxy.register(name,admin.address,secret,[])).to.be.revertedWith("IN")
    })

    it("register a reserved name", async() => {
      const name = "testname123"
      await passReg.reserveName([getNameHash(name)])
      const secret = ethers.utils.formatBytes32String("secret")
      const commit = await proxy.makeCommitment(
          name,
          admin.address,
          secret,
          []
      )

      await expect(proxy.commit(commit)).not.to.be.reverted
      await expect(proxy.register(name,admin.address,secret,[])).to.be.revertedWith("IN")
    })

    it("register a name length < 6", async() => {
      const name = "abcde"
      await passReg.reserveName([getNameHash(name)])
      const secret = ethers.utils.formatBytes32String("secret")
      const commit = await proxy.makeCommitment(
          name,
          admin.address,
          secret,
          []
      )

      await expect(proxy.commit(commit)).not.to.be.reverted
      await expect(proxy.register(name,admin.address,secret,[])).to.be.revertedWith("IN")
    })
  })

  describe("statusOfName(name)", () => {
    it('status of name not in pass and not in doid, should return available', async () => {
        const {0:stt, 1:addr} = await proxy.statusOfName("testname123")
        expect(stt).to.be.equals("available")
        expect(addr).to.be.equals(ZERO_ADDRESS)
    })

    it('status of name in pass and not in doid, should return locked', async () => {
        let name = "testname123"
        await lockPass(admin, passReg, name)
        var {0:stt, 1:addr, 2:id} = await proxy.statusOfName(name)
        expect(stt).to.be.equals("locked")
        expect(addr).to.be.equals(admin.address)
        expect(id).to.be.equals(100001)
        name = "aa"
        await lockPass(admin, passReg, name)
        var {0:stt, 1:addr, 2:id} = await proxy.statusOfName(name)
        expect(stt).to.be.equals("locked")
        expect(addr).to.be.equals(admin.address)
        expect(id).to.be.equals(100002)
    })

    it('status of name reserved and not in doid, should return reserved', async () => {
      const name = 'testname123'
      await passReg.reserveName([getNameHash(name)])
      const { 0: stt, 1: addr ,2:id} = await proxy.statusOfName(name)
      expect(stt).to.be.equals('reserved')
      expect(addr).to.be.equals(ZERO_ADDRESS)
      expect(id).to.be.equals(0)
    })
    
    it('status of name not in pass but in doid, should return registered', async () => {
        const name = "test123name"
        await mintDomain(proxy, admin.address, name)
        const {0:stt, 1:addr, 2:id} = await proxy.statusOfName(name)
        expect(stt).to.be.equals("registered")
        expect(addr).to.be.equals(admin.address)
        expect(id).to.be.equals(getNameHash(name))
    })
  })

  describe("nameOfOwner()", () => {

  })

  describe("AddressResolver", () => {
    it('addr()', async () => {
        const name = "doidtest"
        await mintDomain(proxy, admin.address, name)
        const nameHash = await proxy.nameHash(name)
        expect(await proxy.addrOfType(nameHash, DEFAULT_COIN_TYPE)).to.be.equals(admin.address.toLowerCase())
    })

    it('setAddr()', async () => {
        const name = "doidtest"
        await mintDomain(proxy, admin.address, name)

        const nameHash = await proxy.nameHash(name)

        const coinType2 = 0x800000000 | 56
        const timestamp = (
          await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
        ).timestamp
        const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(32))

        let signature = bob.signMessage(
          await proxy.makeAddrMessage(
            name,
            coinType2,
            bob.address,
            timestamp,
            nonce,
          ),
        )

        await expect(
          proxy.setAddr(
            name,
            coinType2,
            bob.address,
            timestamp,
            nonce,
            signature,
          ),
        )
          .to.emit(proxy, 'AddressChanged')
          .withArgs(nameHash, coinType2, bob.address.toLowerCase())

        expect(await proxy.addrOfType(nameHash, coinType2)).to.be.equal(
          bob.address.toLowerCase(),
        )

        const name2 = "test222"
        const nameHash2 = await proxy.nameHash(name2)

        await expect(
          proxy.setAddr(
            name2,
            coinType2,
            bob.address,
            timestamp,
            nonce,
            signature,
          ),
        ).to.be.revertedWith('ERC721: invalid token ID')
    })
  })
})