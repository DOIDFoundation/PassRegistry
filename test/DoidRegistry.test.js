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

    it('commitment usage', async () => {

    })
  })

  describe("AddressResolver", () => {
    it('', async () => {

    })
  })
})