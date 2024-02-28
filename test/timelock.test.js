require('@nomicfoundation/hardhat-chai-matchers')
const { expect } = require('chai')
const helpers = require('@nomicfoundation/hardhat-network-helpers')

describe('Timelock', function () {
  let timelock

  beforeEach(async function () {
    const accounts = await hre.ethers.getSigners()
    admin = accounts[0]

    const TimeLock = await hre.ethers.getContractFactory('TimeLock')
    timelock = await TimeLock.deploy()
  })

  describe('lock', () => {
    it('user lock 0.1 eth', async () => {
      // queue
      const receiver = admin.address
      const amount = 100
      const func = ''
      const calldata = '0x'
      const ts = (await helpers.time.latest()) + 100
      let tx = await timelock.queue(receiver, amount, func, calldata, ts, {
        value: amount,
      })

      // check balance
      expect(
        Number(await ethers.provider.getBalance(timelock.address)),
      ).to.be.equal(amount)

      //after
      await helpers.mine(101)

      // execute
      tx = await timelock.execute(receiver, amount, func, calldata, ts)
      expect(
        Number(await ethers.provider.getBalance(timelock.address)),
      ).to.be.equal(0)
    })

    it('user cannot lock with other ether amount', async () => {})
    it('cannot unlock until time is up', async () => {
      // queue
      const receiver = admin.address
      const amount = 200
      const func = ''
      const calldata = '0x'
      const ts = (await helpers.time.latest()) + 100
      let tx = await timelock.queue(receiver, amount, func, calldata, ts, {
        value: amount,
      })

      // check balance
      expect(
        Number(await ethers.provider.getBalance(timelock.address)),
      ).to.be.equal(amount)

      await expect(timelock.execute(receiver, amount, func, calldata, ts)).to.be
        .reverted

      //after
      await helpers.mine(90)

      await expect(timelock.execute(receiver, amount, func, calldata, ts)).to.be
        .reverted
    })
  })
})
