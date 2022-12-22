require('@nomicfoundation/hardhat-chai-matchers')
const {BigNumber, utils} = require("ethers")
const { expect } = require('chai')
const hre = require('hardhat')
const { mintDomain, lockPass, ZERO_ADDRESS } = require('./helpers')

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
  })



  describe('Registry', () => {
    it('registry by commit', async () => {
        const name = "test"
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
        const name = "test"
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
        await expect(proxy.register(name, admin.address, secret, data)).to.be.revertedWith("ERC721: token already minted")
    })

    it('wrong commitment secret', async () => {
        const name = "test"
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
  })

  describe("statusOfName(name)", () => {
    it('status of name not in pass and not in doid, should return available', async () => {
        const {0:stt, 1:addr} = await proxy.statusOfName("testname123")
        expect(stt).to.be.equals("available")
        expect(addr).to.be.equals(ZERO_ADDRESS)
    })

    it('status of name in pass and not in doid, should return locked', async () => {
        const name = "testname123"
        await lockPass(admin, passReg, name)
        const {0:stt, 1:addr} = await proxy.statusOfName(name)
        expect(stt).to.be.equals("locked")
        expect(addr).to.be.equals(admin.address)
    })
    it('status of name not in pass but in doid, should return registered', async () => {
        const name = "test123name"
        await mintDomain(proxy, admin.address, name)
        const {0:stt, 1:addr} = await proxy.statusOfName(name)
        expect(stt).to.be.equals("registered")
        expect(addr).to.be.equals(admin.address)
    })
  })

  describe("nameOfOwner()", () => {

  })

  describe("AddressResolver", () => {
    it('addr()', async () => {
        const name = "test"
        await mintDomain(proxy, admin.address, name)
        const nameHash = await proxy.nameHash(name)
        expect(await proxy.addr(nameHash, DEFAULT_COIN_TYPE)).to.be.equals(admin.address.toLowerCase())
    })

    it('setAddr()', async () => {
        const name = "test"
        const nameHash = await proxy.nameHash(name)
        await mintDomain(proxy, admin.address, name)

        const newAddress = bob.address
        await proxy.setAddr(nameHash, DEFAULT_COIN_TYPE, ethers.utils.arrayify(newAddress))
        expect(await proxy.addr(nameHash, DEFAULT_COIN_TYPE)).to.be.equals(newAddress.toLowerCase())
    })
  })
})