//const {
//    time,
//    loadFixture,
//  } = require("@nomicfoundation/hardhat-network-helpers");
require('@nomicfoundation/hardhat-chai-matchers')
const { expect } = require('chai')
const hre = require('hardhat')

function getNameHash(name) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name))
}

describe('PassRegistry', function () {
  let proxy
  let admin, bob, carl
  const INVITER_ROLE = web3.utils.soliditySha3('INVITER_ROLE')
  const AHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('A'))
  const BHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('B'))
  const CHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('C'))

  before(async () => {
    const accounts = await hre.ethers.getSigners()
    admin = accounts[0]
    bob = accounts[1]
    carl = accounts[2]
  })

  beforeEach(async function () {
    const PassRegistry = await hre.ethers.getContractFactory('PassRegistry')
    proxy = await upgrades.deployProxy(PassRegistry, [
      admin.address,
      'pass',
      'pass',
    ])
    await proxy.grantRole(INVITER_ROLE, admin.address)
  })

  describe('NameHash', () => {
    it('getHashByName', async () => {
      expect(getNameHash('abc')).to.equal(
        '0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
      )
      expect(await proxy.getHashByName('abc')).to.equals(getNameHash('abc'))
    })
  })

  describe('LockPass', function () {
    it('use A invitation code from foundation', async function () {
      const passId = 1
      const classHash = AHash
      const hashedMsg = ethers.utils.keccak256(
        ethers.utils.solidityPack(['uint256', 'bytes32'], [passId, classHash]),
      )
      const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
      // console.log(sig)

      await expect(
        proxy.lockPass(sig, '', classHash, passId),
      ).to.be.revertedWith('IC')

      expect(await proxy.balanceOf(admin.address)).to.equals(0)
      await expect(proxy.ownerOf(passId)).to.be.rejected
      await expect(proxy.tokenOfOwnerByIndex(admin.address, 1)).to.be.rejected
    })
    it('use B invitation code from foundation', async function () {
      const passId = 1
      const classHash = BHash
      const hashedMsg = ethers.utils.keccak256(
        ethers.utils.solidityPack(['uint256', 'bytes32'], [passId, classHash]),
      )
      const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
      // console.log(sig)

      await expect(
        proxy.lockPass(sig, '', classHash, passId),
      ).to.be.revertedWith('IC')

      expect(await proxy.balanceOf(admin.address)).to.equals(0)
      await expect(proxy.ownerOf(passId)).to.be.rejected
      await expect(proxy.tokenOfOwnerByIndex(admin.address, 1)).to.be.rejected
    })
    it('use C invitation code from foundation', async function () {
      const passId = 1
      const classHash = CHash
      const hashedMsg = ethers.utils.keccak256(
        ethers.utils.solidityPack(['uint256', 'bytes32'], [passId, classHash]),
      )
      const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
      // console.log(sig)

      await expect(
        proxy.lockPass(sig, '', classHash, passId),
      ).to.be.revertedWith('IC')

      expect(await proxy.balanceOf(admin.address)).to.equals(0)
      await expect(proxy.ownerOf(passId)).to.be.rejected
    })

    it('invitation code from foundation should match class', async function () {
      // A class
      let sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, AHash]),
          ),
        ),
      )
      await expect(proxy.lockPass(sig, '', BHash, 1)).to.be.revertedWith('IC')
      await expect(
        proxy.connect(bob).lockPass(sig, '', CHash, 1),
      ).to.be.revertedWith('IC')
      await expect(proxy.lockPass(sig, '', AHash, 1)).to.be.revertedWith('IC')

      // B class
      sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [2, BHash]),
          ),
        ),
      )
      await expect(
        proxy.connect(bob).lockPass(sig, '', AHash, 2),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(bob).lockPass(sig, '', CHash, 2),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(bob).lockPass(sig, '', BHash, 2),
      ).to.be.revertedWith('IC')

      // C class
      sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [3, CHash]),
          ),
        ),
      )
      await expect(
        proxy.connect(carl).lockPass(sig, '', BHash, 3),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(carl).lockPass(sig, '', AHash, 3),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(carl).lockPass(sig, '', CHash, 3),
      ).to.be.revertedWith('IC')
    })

    it('invitation code from foundation should match passId', async function () {
      // A class
      let sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, AHash]),
          ),
        ),
      )
      await expect(proxy.lockPass(sig, '', AHash, 0)).to.be.revertedWith('IC')
      await expect(proxy.lockPass(sig, '', AHash, 2)).to.be.revertedWith('IC')
      await expect(
        proxy.connect(bob).lockPass(sig, '', AHash, 200000),
      ).to.be.revertedWith('IC')
      await expect(proxy.lockPass(sig, '', AHash, 1)).to.be.revertedWith('IC')
      // B class
      sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [2, BHash]),
          ),
        ),
      )
      await expect(
        proxy.connect(carl).lockPass(sig, '', BHash, 0),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(carl).lockPass(sig, '', BHash, 1),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(bob).lockPass(sig, '', BHash, 100000),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(bob).lockPass(sig, '', BHash, 2),
      ).to.be.revertedWith('IC')

      // C class
      sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [3, CHash]),
          ),
        ),
      )
      await expect(
        proxy.connect(carl).lockPass(sig, '', CHash, 0),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(carl).lockPass(sig, '', CHash, 4),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(carl).lockPass(sig, '', CHash, 1000000),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(carl).lockPass(sig, '', CHash, 3),
      ).to.be.revertedWith('IC')
    })

    it('invitation code from foundation can be used only once', async function () {
      const accounts = await hre.ethers.getSigners()
      await proxy.grantRole(INVITER_ROLE, accounts[3].address)

      // A class
      let sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, AHash]),
          ),
        ),
      )
      await expect(proxy.lockPass(sig, '', AHash, 1)).to.be.revertedWith('IC')
      await expect(
        proxy.connect(bob).lockPass(sig, '', AHash, 1),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(bob).lockPass(sig, '', AHash, 1),
      ).to.be.revertedWith('IC')

      // B class
      sig = await accounts[3].signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [2, BHash]),
          ),
        ),
      )
      await expect(
        proxy.connect(bob).lockPass(sig, '', BHash, 2),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(carl).lockPass(sig, '', BHash, 2),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(carl).lockPass(sig, '', BHash, 2),
      ).to.be.revertedWith('IC')

      // C class
      sig = await accounts[3].signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [3, CHash]),
          ),
        ),
      )
      await expect(
        proxy.connect(carl).lockPass(sig, '', CHash, 3),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(accounts[4]).lockPass(sig, '', CHash, 3),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(accounts[4]).lockPass(sig, '', CHash, 3),
      ).to.be.revertedWith('IC')
    })

    it('user can not generate invitation code from foundation', async function () {
      // A class
      let sig = await bob.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, AHash]),
          ),
        ),
      )
      await expect(proxy.lockPass(sig, '', AHash, 0)).to.be.revertedWith('IC')
      await expect(proxy.lockPass(sig, '', AHash, 1)).to.be.revertedWith('IC')
      await expect(proxy.lockPass(sig, '', AHash, 2)).to.be.revertedWith('IC')

      // B class
      sig = await bob.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, BHash]),
          ),
        ),
      )
      await expect(proxy.lockPass(sig, '', BHash, 0)).to.be.revertedWith('IC')
      await expect(proxy.lockPass(sig, '', BHash, 1)).to.be.revertedWith('IC')
      await expect(proxy.lockPass(sig, '', BHash, 2)).to.be.revertedWith('IC')

      // C class
      sig = await bob.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, CHash]),
          ),
        ),
      )
      await expect(proxy.lockPass(sig, '', CHash, 0)).to.be.revertedWith('IC')
      await expect(proxy.lockPass(sig, '', CHash, 1)).to.be.revertedWith('IC')
      await expect(proxy.lockPass(sig, '', CHash, 2)).to.be.revertedWith('IC')
    })

    it('using a C type invitation code from user', async function () {
      const passId = 1
      const classHash = AHash
      const hashedMsg = ethers.utils.keccak256(
        ethers.utils.solidityPack(['uint256', 'bytes32'], [passId, classHash]),
      )
      const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
      // bob lock A pass
      await expect(
        proxy.connect(bob).lockPass(sig, '', classHash, passId),
      ).to.be.revertedWith('IC')
      expect(await proxy.balanceOf(bob.address)).to.equals(0)

      // bob sign a C invitation code
      const bobsCode = await bob.signMessage(ethers.utils.arrayify(CHash))

      // cannot use if name is not locked
      await expect(
        proxy.connect(carl).lockPass(bobsCode, '', CHash, 0),
      ).to.be.revertedWith('IC')

      // bob should lockName first
      await expect(
        proxy.connect(bob).lockName(passId, 'bob'),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(carl).lockPass(bobsCode, '', CHash, 0),
      ).to.be.revertedWith('IC')

      expect(await proxy.balanceOf(carl.address)).to.equals(0)
      await expect(proxy.tokenOfOwnerByIndex(carl.address, 0)).to.be.rejected
    })

    it('using a C type invitation code from user', async function () {
      let passId = 1
      const classHash = AHash
      const hashedMsg = ethers.utils.keccak256(
        ethers.utils.solidityPack(['uint256', 'bytes32'], [passId, classHash]),
      )
      const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
      // bob lock A pass
      await expect(
        proxy.connect(bob).lockPass(sig, '', classHash, passId),
      ).to.be.revertedWith('IC')
      expect(await proxy.balanceOf(bob.address)).to.equals(0)

      // bob sign a C invitation code
      let bobsCode = ethers.utils.arrayify(
        ethers.utils.hexValue(BigInt(bob.address) ^ BigInt(CHash)),
        { hexPad: 'left' },
      )

      // cannot use if name is not locked
      await expect(
        proxy.connect(carl).lockPass(bobsCode, '', CHash, 0),
      ).to.be.revertedWith('IC')
      // bob should lockName first
      await expect(
        proxy.connect(bob).lockName(passId, 'bob'),
      ).to.be.revertedWith('IC')

      await expect(
        proxy.connect(carl).lockPass(bobsCode, '', CHash, ++passId),
      ).to.be.revertedWith('IC')

      await expect(
        proxy.connect(carl).lockPass(bobsCode, '', CHash, 0),
      ).to.be.revertedWith('IC')
      expect(await proxy.balanceOf(carl.address)).to.equals(0)
      await expect(proxy.tokenOfOwnerByIndex(carl.address, 0)).to.be.rejected

      const accounts = await hre.ethers.getSigners()
      // bob sign a A invitation code
      bobsCode = ethers.utils.arrayify(
        ethers.utils.hexValue(BigInt(bob.address) ^ BigInt(AHash)),
        { hexPad: 'left' },
      )
      await expect(
        proxy.connect(accounts[3]).lockPass(bobsCode, '', AHash, 0),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(accounts[3]).lockPass(bobsCode, '', AHash, ++passId),
      ).to.be.revertedWith('IC')
      bobsCode = ethers.utils.arrayify(
        ethers.utils.hexValue(
          BigInt(admin.address) ^
            BigInt(
              ethers.utils.keccak256(
                ethers.utils.solidityPack(
                  ['uint256', 'bytes32'],
                  [++passId, AHash],
                ),
              ),
            ),
        ),
        { hexPad: 'left' },
      )
      await expect(
        proxy.connect(accounts[3]).lockPass(bobsCode, '', AHash, passId),
      ).to.be.revertedWith('IC')

      // bob sign a B invitation code
      bobsCode = ethers.utils.arrayify(
        ethers.utils.hexValue(BigInt(bob.address) ^ BigInt(BHash)),
        { hexPad: 'left' },
      )
      await expect(
        proxy.connect(accounts[4]).lockPass(bobsCode, '', BHash, 0),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(accounts[4]).lockPass(bobsCode, '', BHash, ++passId),
      ).to.be.revertedWith('IC')
      bobsCode = ethers.utils.arrayify(
        ethers.utils.hexValue(
          BigInt(admin.address) ^
            BigInt(
              ethers.utils.keccak256(
                ethers.utils.solidityPack(
                  ['uint256', 'bytes32'],
                  [++passId, BHash],
                ),
              ),
            ),
        ),
        { hexPad: 'left' },
      )
      await expect(
        proxy.connect(accounts[4]).lockPass(bobsCode, '', BHash, passId),
      ).to.be.revertedWith('IC')

      // bob sign a C invitation code with passId
      bobsCode = ethers.utils.arrayify(
        ethers.utils.hexValue(
          BigInt(admin.address) ^
            BigInt(
              ethers.utils.keccak256(
                ethers.utils.solidityPack(
                  ['uint256', 'bytes32'],
                  [++passId, CHash],
                ),
              ),
            ),
        ),
        { hexPad: 'left' },
      )
      await expect(
        proxy.connect(accounts[5]).lockPass(bobsCode, '', CHash, passId),
      ).to.be.revertedWith('IC')
    })

    it('invitation code from user can only be class C', async function () {
      let sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, AHash]),
          ),
        ),
      )
      await expect(
        proxy.connect(bob).lockPass(sig, 'test', AHash, 1),
      ).to.be.revertedWith('IC')

      // A class
      sig = await bob.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [2, AHash]),
          ),
        ),
      )
      await expect(
        proxy.connect(carl).lockPass(sig, '', AHash, 2),
      ).to.be.revertedWith('IC')

      // B class
      sig = await bob.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [2, BHash]),
          ),
        ),
      )
      await expect(
        proxy.connect(carl).lockPass(sig, '', BHash, 2),
      ).to.be.revertedWith('IC')

      // C class with passId
      sig = await bob.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [2, CHash]),
          ),
        ),
      )
      expect(
        proxy.connect(carl).lockPass(sig, '', CHash, 2),
      ).to.be.revertedWith('IC')

      // C class without passId
      sig = await bob.signMessage(ethers.utils.arrayify(CHash))
      expect(
        proxy.connect(carl).lockPass(sig, '', CHash, 0),
      ).to.be.revertedWith('IC')
      expect(await proxy.balanceOf(carl.address)).to.equals(0)
      expect(proxy.tokenOfOwnerByIndex(carl.address, 0)).to.be.rejected
    })

    it('user can get 18 invitations from class A', async function () {
      const accounts = await hre.ethers.getSigners()
      const limit = [AHash, 18]
      const sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, limit[0]]),
          ),
        ),
      )
      expect(
        proxy.connect(accounts[1]).lockPass(sig, 'test', limit[0], 1),
      ).to.be.revertedWith('IC')
      expect(
        (await proxy.getUserInvitedNumber(accounts[1].address))[1],
      ).to.equals(0)
      const sig2 = await accounts[1].signMessage(ethers.utils.arrayify(CHash))
      for (i = 1; i <= limit[1]; i++) {
        await expect(
          proxy.connect(accounts[i + 1]).lockPass(sig2, '', CHash, 0),
          'class ' + limit[0] + ' at ' + i + '/' + limit[1],
        ).to.be.revertedWith('IC')
      }

      await expect(
        proxy.connect(accounts[limit[1]]).lockPass(sig2, '', CHash, 0),
        'class ' + limit[0] + ' at ' + (limit[1] + 1),
      ).to.be.reverted
    })

    it('user can get 18 invitations from class B', async function () {
      const accounts = await hre.ethers.getSigners()
      const limit = [BHash, 18]
      const sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, limit[0]]),
          ),
        ),
      )
      expect(
        proxy.connect(accounts[1]).lockPass(sig, 'test', limit[0], 1),
      ).to.be.revertedWith('IC')
      expect(
        (await proxy.getUserInvitedNumber(accounts[1].address))[1],
      ).to.equals(0)
      const sig2 = await accounts[1].signMessage(ethers.utils.arrayify(CHash))
      for (i = 1; i <= limit[1]; i++) {
        await expect(
          proxy.connect(accounts[i + 1]).lockPass(sig2, '', CHash, 0),
          'class ' + limit[0] + ' at ' + i + '/' + limit[1],
        ).to.be.revertedWith('IC')
      }

      await expect(
        proxy.connect(accounts[limit[1]]).lockPass(sig2, '', CHash, 0),
        'class ' + limit[0] + ' at ' + (limit[1] + 1),
      ).to.be.revertedWith('IC')
    })

    it('user can get 3 invitations from class C', async function () {
      const accounts = await hre.ethers.getSigners()
      const limit = [CHash, 3]
      const sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, limit[0]]),
          ),
        ),
      )
      expect(
        proxy.connect(accounts[1]).lockPass(sig, 'testtt', limit[0], 1),
      ).to.be.revertedWith('IC')
      expect(
        (await proxy.getUserInvitedNumber(accounts[1].address))[1],
      ).to.equals(0)
      const sig2 = await accounts[1].signMessage(ethers.utils.arrayify(CHash))
      for (i = 1; i <= limit[1]; i++) {
        await expect(
          proxy.connect(accounts[i + 1]).lockPass(sig2, '', CHash, 0),
          'class ' + limit[0] + ' at ' + i + '/' + limit[1],
        ).to.be.revertedWith('IC')
      }

      await expect(
        proxy.connect(accounts[limit[1]]).lockPass(sig2, '', CHash, 0),
        'class ' + limit[0] + ' at ' + (limit[1] + 1),
      ).to.be.revertedWith('IC')
    })

    it('every user can use invitation code only once', async function () {
      let sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, AHash]),
          ),
        ),
      )
      //first time
      expect(proxy.lockPass(sig, '', AHash, 1)).to.be.revertedWith('IC')
      //seconde time
      let sig2 = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [2, AHash]),
          ),
        ),
      )
      await expect(proxy.lockPass(sig, '', AHash, 2)).to.be.revertedWith('IC')
    })
  })

  describe('LockName', function () {
    it('lock name with passid', async function () {
      let passId = 1
      const sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [passId, AHash]),
          ),
        ),
      )
      expect(proxy.lockPass(sig, '', AHash, passId)).to.be.revertedWith('IC')

      // 1 * A pass
      await expect(proxy.lockName(passId, 'a')).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, 'ab')).to.be.revertedWith('IC')
    })

    it('lock name should success only once', async function () {
      let passId = 1
      const sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [passId, AHash]),
          ),
        ),
      )
      expect(proxy.lockPass(sig, 'ab', AHash, passId)).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, 'abc')).to.be.revertedWith('IC')
    })

    it('lock name length limit with A code', async function () {
      let passId = 1
      let sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [passId, AHash]),
          ),
        ),
      )
      expect(proxy.lockPass(sig, '', AHash, passId)).to.be.revertedWith('IC')
      expect(proxy.lockName(passId, 'a')).to.be.revertedWith('IC')
      expect(proxy.lockName(passId, 'ab')).to.be.revertedWith('IC')

      passId++
      sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [passId, AHash]),
          ),
        ),
      )
      expect(
        proxy.connect(bob).lockPass(sig, '', AHash, passId),
      ).to.be.revertedWith('IC')
      expect(proxy.connect(bob).lockName(passId, '😄')).to.be.revertedWith('IC')
    })

    it('lock name length limit with B code', async function () {
      let passId = 1
      let classHash = BHash
      let sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['uint256', 'bytes32'],
              [passId, classHash],
            ),
          ),
        ),
      )
      await expect(
        proxy.lockPass(sig, '', classHash, passId),
      ).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, 'a')).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, 'ab')).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, 'abc')).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, '😄')).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, 'abcd')).to.be.revertedWith('IC')

      passId++
      sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['uint256', 'bytes32'],
              [passId, classHash],
            ),
          ),
        ),
      )
      await expect(
        proxy.connect(bob).lockPass(sig, '', classHash, passId),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(bob).lockName(passId, '😄😄'),
      ).to.be.revertedWith('IC')
    })

    it('lock name length limit with C code', async function () {
      let passId = 1
      let classHash = CHash
      let sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['uint256', 'bytes32'],
              [passId, classHash],
            ),
          ),
        ),
      )
      await expect(
        proxy.lockPass(sig, '', classHash, passId),
      ).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, 'a')).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, 'ab')).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, 'abc')).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, 'abcd')).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, 'abcde')).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, '😄')).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, '😄😄')).to.be.revertedWith('IC')
      await expect(proxy.lockName(passId, 'abcdef')).to.be.revertedWith('IC')

      passId++
      sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(
              ['uint256', 'bytes32'],
              [passId, classHash],
            ),
          ),
        ),
      )
      await expect(
        proxy.connect(bob).lockPass(sig, '', classHash, passId),
      ).to.be.revertedWith('IC')
      await expect(
        proxy.connect(bob).lockName(passId, '😄😄😄'),
      ).to.be.revertedWith('IC')
    })
  })

  describe('Name available', function () {
    it('invalid name length', async function () {
      expect(await proxy.lenValid(2, 'c')).to.equals(false)
      expect(await proxy.lenValid(2, '1')).to.equals(false)
      expect(await proxy.lenValid(2, '.')).to.equals(false)
      expect(await proxy.lenValid(3, '😊')).to.equals(false)
      expect(await proxy.lenValid(3, '测')).to.equals(false)
      expect(await proxy.lenValid(3, 'ab')).to.equals(false)
      expect(await proxy.lenValid(4, 'abc')).to.equals(false)
      expect(await proxy.lenValid(6, '测试1')).to.equals(false)
    })

    it('valid name length', async function () {
      expect(await proxy.lenValid(2, '12')).to.equals(true)
      expect(await proxy.lenValid(2, '123')).to.equals(true)
      expect(await proxy.lenValid(2, 'ab')).to.equals(true)
      expect(await proxy.lenValid(2, 'abc')).to.equals(true)
      expect(await proxy.lenValid(2, '测')).to.equals(true)
      expect(await proxy.lenValid(1, '😊')).to.equals(true)
      expect(await proxy.lenValid(2, '😊')).to.equals(true)
      expect(await proxy.lenValid(4, '测试')).to.equals(true)
      expect(await proxy.lenValid(5, '测试1')).to.equals(true)
      expect(await proxy.lenValid(6, '测试12')).to.equals(true)
    })

    it('reserve name', async function () {
      let testname = [ethers.utils.keccak256(ethers.utils.toUtf8Bytes('aa'))]
      await proxy.reserveName(testname)
      expect(await proxy.nameReserves('aa')).to.equals(true)

      let testnames = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('aa')),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('bb')),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('111122')),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('测试名字')),
      ]
      await proxy.reserveName(testnames)
      expect(await proxy.nameReserves('111122')).to.equals(true)
      expect(await proxy.nameReserves('ab')).to.equals(false)
      expect(await proxy.nameReserves('测试名字')).to.equals(true)
      expect(await proxy.nameReserves('测试x名字')).to.equals(false)
    })

    it('dup name', async function () {})

    it('name max_length=64', async function () {
      expect(
        await proxy.lenValid(
          2,
          '1111111111111111111111111111111111111111111111111111111111111111',
        ),
      ).to.equals(true)
      expect(
        await proxy.lenValid(
          2,
          '11111111111111111111111111111111111111111111111111111111111111111',
        ),
      ).to.equals(false)
    })
  })
})
