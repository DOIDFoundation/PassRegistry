require('@nomicfoundation/hardhat-chai-matchers')
const { expect } = require('chai')
const helpers = require('@nomicfoundation/hardhat-network-helpers')

describe('DoidTimelock', function () {
  let admin, bob
  let DoidTimeLock, timelock

  beforeEach(async function () {
    const accounts = await hre.ethers.getSigners()
    admin = accounts[0]
    bob = accounts[1]

    DoidTimeLock = await hre.ethers.getContractFactory('DoidTimeLock')
    timelock = await DoidTimeLock.deploy()
  })

  describe('lock', () => {
    it('user lock and execute eth', async () => {
      // queue
      const amount = 100000
      const lockTime = 100 * 24 * 3600
      const ts = (await helpers.time.latest()) + lockTime
      let tx = await timelock.queue(ts, {
        value: amount,
      })

      // check balance
      expect(
        Number(await ethers.provider.getBalance(timelock.address)),
      ).to.be.equal(amount)

      //after
      await helpers.mine(lockTime + 1)

      // execute
      await expect(timelock.connect(bob).execute()).to.be.reverted
      tx = await timelock.execute()
      expect(
        Number(await ethers.provider.getBalance(timelock.address)),
      ).to.be.equal(0)
    })

    it('user cannot execute more than once', async () => {
      // queue
      const amount = 100000
      const lockTime = 100 * 24 * 3600
      const ts = (await helpers.time.latest()) + lockTime
      let tx = await timelock.queue(ts, {
        value: amount,
      })
      tx = await timelock.connect(bob).queue(ts, {
        value: amount,
      })

      //after
      await helpers.mine(lockTime + 1)

      // execute twice
      expect(await timelock.connect(bob).execute()).to.be.ok
      await expect(timelock.connect(bob).execute()).to.be.reverted
      expect(await timelock.connect(admin).execute()).to.be.ok
    })

    it('cannot unlock until time is up', async () => {
      // queue
      const amount = 100000
      const lockTime = 100 * 24 * 3600
      const ts = (await helpers.time.latest()) + lockTime
      let tx = await timelock.queue(ts, {
        value: amount,
      })

      // check balance
      expect(
        Number(await ethers.provider.getBalance(timelock.address)),
      ).to.be.equal(amount)

      await expect(timelock.execute()).to.be.reverted

      //after
      await helpers.mine(lockTime)

      await expect(timelock.execute()).to.be.ok
    })
  })
  describe('admin emergency withdraw', () => {
    it('admin withdraw, user cannot use emergency function', async () => {
      // queue
      const amount = 100000
      const lockTime = 100 * 24 * 3600
      const ts = (await helpers.time.latest()) + lockTime
      let tx = await timelock.connect(bob).queue(ts, {
        value: amount,
      })

      await helpers.mine(100)
      // execute withdraw with bob
      await expect(
        timelock.connect(bob).emergencyWithdraw(100),
      ).revertedWithCustomError(DoidTimeLock, 'NotOwnerError')
      expect(
        Number(await ethers.provider.getBalance(timelock.address)),
      ).to.be.equal(amount)

      // execute with admin
      expect(await timelock.emergencyWithdraw(100)).to.be.ok
      expect(
        Number(await ethers.provider.getBalance(timelock.address)),
      ).to.be.equal(amount - 100)
    })
  })
})
