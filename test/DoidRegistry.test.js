require('@nomicfoundation/hardhat-chai-matchers')
const {BigNumber, utils} = require("ethers")
const { expect } = require('chai')
const hre = require('hardhat')
const { ZERO_ADDRESS } = require('./helpers')

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

    const DoidRegistry = await hre.ethers.getContractFactory('DoidRegistry')
    proxy = await upgrades.deployProxy(DoidRegistry, [
        passReg.address,
        0,
        86400
    ])
  })

  async function mintDomain(){
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
  }

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


  describe("PassReserved()", () => {
    it('pass is reserved in passRegistry', async () => {
        //await passReg.
    })
  })

  describe("AddressResolver", () => {
    it('addr()', async () => {
        const name = "test"
        await mintDomain(name)
        const nameHash = await proxy.nameHash(name)
        console.log(await proxy.addr(nameHash, 60))
        // hex to ascii ???
    })

    it('setAddr()', async () => {
        const name = "test"
        await mintDomain(name)

        const nameHash = await proxy.nameHash(name)
        console.log(await proxy.addr(nameHash, 60))

        const name2 = "test222"
        const nameHash2 = await proxy.nameHash(name2)

        await expect(proxy.setAddr(nameHash2, 60, ethers.utils.toUtf8Bytes(name2))).to.be.revertedWith("ERC721: invalid token ID")
    })
  })
})