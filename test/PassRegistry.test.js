//const {
//    time,
//    loadFixture,
//  } = require("@nomicfoundation/hardhat-network-helpers");
require('@nomicfoundation/hardhat-chai-matchers')
const { expect } = require('chai')
const hre = require('hardhat')

describe('PassRegistry', function () {
  let proxy
  let admin, bob, carl
  const INVITER_ROLE = web3.utils.soliditySha3('INVITER_ROLE')
  const AHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('A'))
  const BHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('B'))
  const CHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('C'))

  beforeEach(async function () {
    const accounts = await hre.ethers.getSigners()
    admin = accounts[0]
    bob = accounts[1]
    carl = accounts[2]
    const PassRegistry = await hre.ethers.getContractFactory('PassRegistry')
    proxy = await upgrades.deployProxy(PassRegistry, [
      admin.address,
      'pass',
      'pass',
    ])
    await proxy.grantRole(INVITER_ROLE, admin.address)
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

      await expect(proxy.lockPass(sig, '', classHash, passId)).not.to.be
        .reverted

      expect(await proxy.balanceOf(admin.address)).to.equals(6)
      expect(await proxy.ownerOf(passId)).to.equals(admin.address)
      expect(
        await proxy.tokenOfOwnerByIndex(admin.address, 1),
      ).to.greaterThanOrEqual(100000)
    })
    it('use B invitation code from foundation', async function () {
      const passId = 1
      const classHash = BHash
      const hashedMsg = ethers.utils.keccak256(
        ethers.utils.solidityPack(['uint256', 'bytes32'], [passId, classHash]),
      )
      const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
      // console.log(sig)

      await expect(proxy.lockPass(sig, '', classHash, passId)).not.to.be
        .reverted

      expect(await proxy.balanceOf(admin.address)).to.equals(6)
      expect(await proxy.ownerOf(passId)).to.equals(admin.address)
      expect(
        await proxy.tokenOfOwnerByIndex(admin.address, 1),
      ).to.greaterThanOrEqual(100000)
    })
    it('use C invitation code from foundation', async function () {
      const passId = 1
      const classHash = CHash
      const hashedMsg = ethers.utils.keccak256(
        ethers.utils.solidityPack(['uint256', 'bytes32'], [passId, classHash]),
      )
      const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
      // console.log(sig)

      await expect(proxy.lockPass(sig, '', classHash, passId)).not.to.be
        .reverted

      expect(await proxy.balanceOf(admin.address)).to.equals(1)
      expect(await proxy.ownerOf(passId)).to.equals(admin.address)
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
      await expect(proxy.lockPass(sig, '', BHash, 1)).to.be.revertedWith('IR')
      await expect(
        proxy.connect(bob).lockPass(sig, '', CHash, 1),
      ).to.be.revertedWith('IR')
      await expect(proxy.lockPass(sig, '', AHash, 1)).not.to.be.reverted

      // B class
      sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [2, BHash]),
          ),
        ),
      )
      await expect(proxy.lockPass(sig, '', AHash, 2)).to.be.revertedWith('IR')
      await expect(
        proxy.connect(bob).lockPass(sig, '', CHash, 2),
      ).to.be.revertedWith('IR')
      await expect(proxy.connect(bob).lockPass(sig, '', BHash, 2)).not.to.be
        .reverted

      // C class
      sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [3, CHash]),
          ),
        ),
      )
      await expect(proxy.lockPass(sig, '', BHash, 3)).to.be.revertedWith('IR')
      await expect(
        proxy.connect(carl).lockPass(sig, '', AHash, 3),
      ).to.be.revertedWith('IR')
      await expect(proxy.connect(carl).lockPass(sig, '', CHash, 3)).not.to.be
        .reverted
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
      await expect(proxy.lockPass(sig, '', AHash, 2)).to.be.revertedWith('IR')
      await expect(
        proxy.connect(bob).lockPass(sig, '', AHash, 200000),
      ).to.be.revertedWith('IR')
      await expect(proxy.lockPass(sig, '', AHash, 1)).not.to.be.reverted

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
      await expect(proxy.lockPass(sig, '', BHash, 1)).to.be.revertedWith('II')
      await expect(
        proxy.connect(bob).lockPass(sig, '', BHash, 100000),
      ).to.be.revertedWith('IR')
      await expect(proxy.connect(bob).lockPass(sig, '', BHash, 2)).not.to.be
        .reverted

      // C class
      sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [3, CHash]),
          ),
        ),
      )
      await expect(proxy.lockPass(sig, '', CHash, 0)).to.be.revertedWith('IC')
      await expect(
        proxy.connect(carl).lockPass(sig, '', CHash, 4),
      ).to.be.revertedWith('IR')
      await expect(
        proxy.connect(carl).lockPass(sig, '', CHash, 1000000),
      ).to.be.revertedWith('IR')
      await expect(proxy.connect(carl).lockPass(sig, '', CHash, 3)).not.to.be
        .reverted
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
      await expect(proxy.lockPass(sig, '', AHash, 1)).not.to.be.reverted
      await expect(proxy.lockPass(sig, '', AHash, 1)).to.be.revertedWith('II')
      await expect(
        proxy.connect(bob).lockPass(sig, '', AHash, 1),
      ).to.be.revertedWith('II')

      // B class
      sig = await accounts[3].signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [2, BHash]),
          ),
        ),
      )
      await expect(proxy.connect(bob).lockPass(sig, '', BHash, 2)).not.to.be
        .reverted
      await expect(proxy.lockPass(sig, '', BHash, 2)).to.be.revertedWith('II')
      await expect(
        proxy.connect(carl).lockPass(sig, '', BHash, 2),
      ).to.be.revertedWith('II')

      // C class
      sig = await accounts[3].signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [3, CHash]),
          ),
        ),
      )
      await expect(proxy.connect(carl).lockPass(sig, '', CHash, 3)).not.to.be
        .reverted
      await expect(proxy.lockPass(sig, '', CHash, 3)).to.be.revertedWith('II')
      await expect(
        proxy.connect(accounts[4]).lockPass(sig, '', CHash, 3),
      ).to.be.revertedWith('II')
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
      await expect(proxy.lockPass(sig, '', AHash, 1)).to.be.revertedWith('IR')
      await expect(proxy.lockPass(sig, '', AHash, 2)).to.be.revertedWith('IR')

      // B class
      sig = await bob.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, BHash]),
          ),
        ),
      )
      await expect(proxy.lockPass(sig, '', BHash, 0)).to.be.revertedWith('IC')
      await expect(proxy.lockPass(sig, '', BHash, 1)).to.be.revertedWith('IR')
      await expect(proxy.lockPass(sig, '', BHash, 2)).to.be.revertedWith('IR')

      // C class
      sig = await bob.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, CHash]),
          ),
        ),
      )
      await expect(proxy.lockPass(sig, '', CHash, 0)).to.be.revertedWith('IC')
      await expect(proxy.lockPass(sig, '', CHash, 1)).to.be.revertedWith('IR')
      await expect(proxy.lockPass(sig, '', CHash, 2)).to.be.revertedWith('IR')
    })

    it('using a C type invitation code from user', async function () {
      const passId = 1
      const classHash = AHash
      const hashedMsg = ethers.utils.keccak256(
        ethers.utils.solidityPack(['uint256', 'bytes32'], [passId, classHash]),
      )
      const sig = await admin.signMessage(ethers.utils.arrayify(hashedMsg))
      // bob lock A pass
      await expect(proxy.connect(bob).lockPass(sig, '', classHash, passId)).not
        .to.be.reverted
      expect(await proxy.balanceOf(bob.address)).to.equals(6)

      // bob sign a C invitation code
      const bobsCode = await bob.signMessage(ethers.utils.arrayify(CHash))

      // cannot use if name is not locked
      await expect(
        proxy.connect(carl).lockPass(bobsCode, '', CHash, 0),
      ).to.be.revertedWith('IC')

      // bob should lockName first
      await expect(proxy.connect(bob).lockName(passId, 'bob')).not.to.be
        .reverted
      await expect(proxy.connect(carl).lockPass(bobsCode, '', CHash, 0)).not.to
        .be.reverted

      expect(await proxy.balanceOf(carl.address)).to.equals(1)
      expect(
        await proxy.tokenOfOwnerByIndex(carl.address, 0),
      ).to.greaterThanOrEqual(100000)
    })

    it('invitation code from user can only be class C', async function () {
      let sig = await admin.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [1, AHash]),
          ),
        ),
      )
      await expect(proxy.connect(bob).lockPass(sig, 'test', AHash, 1)).not.to.be
        .reverted

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
      ).to.be.revertedWith('IR')

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
      ).to.be.revertedWith('IR')

      // C class with passId
      sig = await bob.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.solidityPack(['uint256', 'bytes32'], [2, CHash]),
          ),
        ),
      )
      await expect(
        proxy.connect(carl).lockPass(sig, '', CHash, 2),
      ).to.be.revertedWith('IR')

      // C class without passId
      sig = await bob.signMessage(ethers.utils.arrayify(CHash))
      await expect(proxy.connect(carl).lockPass(sig, '', CHash, 0)).not.to.be
        .reverted
      expect(await proxy.balanceOf(carl.address)).to.equals(1)
      expect(
        await proxy.tokenOfOwnerByIndex(carl.address, 0),
      ).to.greaterThanOrEqual(100000)
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
      await proxy.connect(accounts[1]).lockPass(sig, 'test', limit[0], 1)
      expect(
        (await proxy.getUserInvitedNumber(accounts[1].address))[1],
      ).to.equals(limit[1])
      const sig2 = await accounts[1].signMessage(ethers.utils.arrayify(CHash))
      for (i = 1; i <= limit[1]; i++) {
        await expect(
          proxy.connect(accounts[i + 1]).lockPass(sig2, '', CHash, 0),
          'class ' + limit[0] + ' at ' + i + '/' + limit[1],
        ).not.to.be.reverted
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
      await proxy.connect(accounts[1]).lockPass(sig, 'test', limit[0], 1)
      expect(
        (await proxy.getUserInvitedNumber(accounts[1].address))[1],
      ).to.equals(limit[1])
      const sig2 = await accounts[1].signMessage(ethers.utils.arrayify(CHash))
      for (i = 1; i <= limit[1]; i++) {
        await expect(
          proxy.connect(accounts[i + 1]).lockPass(sig2, '', CHash, 0),
          'class ' + limit[0] + ' at ' + i + '/' + limit[1],
        ).not.to.be.reverted
      }

      await expect(
        proxy.connect(accounts[limit[1]]).lockPass(sig2, '', CHash, 0),
        'class ' + limit[0] + ' at ' + (limit[1] + 1),
      ).to.be.reverted
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
      await proxy.connect(accounts[1]).lockPass(sig, 'testtt', limit[0], 1)
      expect(
        (await proxy.getUserInvitedNumber(accounts[1].address))[1],
      ).to.equals(limit[1])
      const sig2 = await accounts[1].signMessage(ethers.utils.arrayify(CHash))
      for (i = 1; i <= limit[1]; i++) {
        await expect(
          proxy.connect(accounts[i + 1]).lockPass(sig2, '', CHash, 0),
          'class ' + limit[0] + ' at ' + i + '/' + limit[1],
        ).not.to.be.reverted
      }

      await expect(
        proxy.connect(accounts[limit[1]]).lockPass(sig2, '', CHash, 0),
        'class ' + limit[0] + ' at ' + (limit[1] + 1),
      ).to.be.reverted
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
      await expect(proxy.lockPass(sig, '', AHash, passId)).not.to.be.reverted

      // 1 * A pass
      await expect(proxy.lockName(passId, 'a')).to.be.revertedWith('IN')
      await expect(proxy.lockName(passId, 'ab'))
        .to.emit(proxy, 'LockName')
        .withArgs(admin.address, passId, 'ab')

      // other C pass
      passId = await proxy.tokenOfOwnerByIndex(admin.address, 1)
      await expect(proxy.lockName(passId, 'ab')).to.be.revertedWith('IN')
      await expect(proxy.lockName(passId, 'abcde')).to.be.revertedWith('IN')
      await expect(proxy.lockName(passId, 'abcdef'))
        .to.emit(proxy, 'LockName')
        .withArgs(admin.address, passId, 'abcdef')

      // not owned passid
      passId = await proxy.tokenOfOwnerByIndex(admin.address, 2)
      await proxy.transferFrom(admin.address, bob.address, passId)
      await expect(proxy.lockName(passId, 'abcde')).to.be.revertedWith('IP')

      // non-exist passid
      await expect(proxy.lockName(3, 'abcde')).to.be.revertedWith(
        'ERC721: invalid token ID',
      )
    })
  })

  describe('Name available', function () {
    it('invalid name length', async function () {
      expect(await proxy.lenValid(2, 'c')).to.equals(false)
      expect(await proxy.lenValid(2, '1')).to.equals(false)
      expect(await proxy.lenValid(2, '.')).to.equals(false)
      expect(await proxy.lenValid(2, '测')).to.equals(false)
      expect(await proxy.lenValid(3, 'ab')).to.equals(false)
      expect(await proxy.lenValid(4, 'abc')).to.equals(false)
    })
    it('valid name length', async function () {
      expect(await proxy.lenValid(2, '12')).to.equals(true)
      expect(await proxy.lenValid(2, '123')).to.equals(true)
      expect(await proxy.lenValid(2, 'ab')).to.equals(true)
      expect(await proxy.lenValid(2, 'abc')).to.equals(true)
      expect(await proxy.lenValid(2, '测试')).to.equals(true)
      expect(await proxy.lenValid(2, '测试1')).to.equals(true)
      expect(await proxy.lenValid(3, '测试1')).to.equals(true)
      expect(await proxy.lenValid(4, '测试12')).to.equals(true)
    })

    it('in denylist', async function () {})

    it('not in denylist', async function () {})

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
