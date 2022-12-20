require('@nomicfoundation/hardhat-chai-matchers')
const {BigNumber, utils} = require("ethers")
const { expect } = require('chai')
const hre = require('hardhat')
const { ZERO_ADDRESS } = require('./helpers')

describe('DoidRegistry', function () {
  let proxy, passRegistry
  let admin, bob, carl

  beforeEach(async function () {
    const accounts = await hre.ethers.getSigners()
    admin = accounts[0]
    bob = accounts[1]
    carl = accounts[2]
    passRegistry = admin.address
    const DoidRegistry = await hre.ethers.getContractFactory('DoidRegistry')
    proxy = await upgrades.deployProxy(DoidRegistry, [
        passRegistry,
        0,
        7200
    ])
  })

  describe('Registry', () => {
    it('registry by commit', async () => {
        const name = "test"
        const owner = admin.address
        const duration = 3600
        const secret = ethers.utils.formatBytes32String("secret")
        const data = []
        const commit = await proxy.makeCommitment(
            name,
            owner,
            duration,
            secret,
            data
        )

        //await proxy.registry(name, 0, )
    })
  })

  describe("AddressResolver", () => {
    it('', async () => {

    })
  })
})