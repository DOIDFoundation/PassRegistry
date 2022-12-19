require('@nomicfoundation/hardhat-chai-matchers')
const {BigNumber, utils} = require("ethers")
const { expect } = require('chai')
const hre = require('hardhat')
const { ZERO_ADDRESS, mintDomain } = require('./helpers')
const { namehash } = require('@ensdomains/eth-ens-namehash')

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
        admin.address,
        passRegistry
    ])
  })

  describe('resolve name ', function() {
    it('resolveOf(tokenId)', async function() {
        const tokenId = await mintDomain(proxy, admin.address, ['test', 'doid'], false, [], []);
        expect(await proxy.resolverOf(tokenId)).to.be.equal(proxy.address);
  
        await proxy.burn(tokenId);
        expect(await proxy.resolverOf(tokenId)).to.be.equal(ZERO_ADDRESS);
  
        await mintDomain(proxy, admin.address, ['test', 'doid'], false, [], []);
        expect(await proxy.resolverOf(tokenId)).to.be.equal(proxy.address);
    })
  })

  describe('namehash()', function(){
    it('proxy.namehash should equal ens-namehash', async () => {
        const tokenId = await proxy.namehash(['test', 'doid']);
//        expect(tokenId).to.be.equal(namehash.hash('test.doid'));
      });

      it('should revert when childId lable is empty', async () => {
        await expect(proxy.namehash(['', 'doid'])).to.be.revertedWith('Registry: LABEL_EMPTY');
      });
 
  })

  describe('Registry, mintWithRecords()', function () {
    it('registry a domain without records', async function() {
        const label = ["test"]
        await mintDomain(proxy, admin.address, label, false, [], [])

        const tokenId = await proxy.namehash(label)
        expect(await proxy.ownerOf(tokenId)).to.be.equals(admin.address)
    })
    it('registry a ns', async function () {
        const label = ["test", "doid"]
        await mintDomain(proxy, admin.address, label, false, ['key'], ['value'])

        const tokenId = await proxy.namehash(label)
        expect(await proxy.ownerOf(tokenId)).to.be.equals(admin.address)
        expect(await proxy.get('key', tokenId)).to.be.equals('value');
    })

    it('resolve a ns', async function () {

    })

    it('mint subdomain', async () => {
        const labels = ['test123', 'doid'];
        await mintDomain(proxy, admin.address, labels, false, [], []);

        labels.unshift('subdomain');
        const tokenId = await proxy.namehash(labels);
        await mintDomain(proxy, admin.address, labels, false, ['key1'], ['value1']);
        expect(await proxy.ownerOf(tokenId)).to.be.equal(admin.address);
      });

    it('should produce NewURI event', async () => {
      const labels = ['test123', 'crypto'];
      const tokenId = await proxy.namehash(labels);

      await expect(
        proxy.mintWithRecords(
          admin.address,
          labels,
          ['key1'],
          ['value1'],
          false
        )
      ).to.emit(proxy, 'NewURI')
        .withArgs(tokenId, 'test123.crypto');

      expect(await proxy.ownerOf(tokenId)).to.be.equal(admin.address);
    });
  })

  describe('Registry (ownership management)', () => {
    let tokenId;

    beforeEach(async () => {
      tokenId = await mintDomain(proxy, admin.address, ['test'], false, [], []);
    });

    describe('setOwner', () => {
      it('sets owner correctly', async () => {
        await proxy.setOwner(owner.address, tokenId);

        expect(await proxy.ownerOf(tokenId)).to.be.equal(owner.address);
      });

//      it('sets owner correctly even if token is upgraded', async () => {
//        tokenId = await mintRandomDomain(unsRegistryMock, coinbase.address, 'crypto');
//        await unsRegistryMock.upgradeAll([tokenId]);
//
//        await unsRegistryMock.setOwner(owner.address, tokenId);
//
//        expect(await unsRegistryMock.ownerOf(tokenId)).to.be.equal(owner.address);
//      });
//
//      it('produces ERC721 error when transfering upgraded token to zero address', async () => {
//        tokenId = await mintRandomDomain(unsRegistryMock, coinbase.address, 'crypto');
//        await unsRegistryMock.upgradeAll([tokenId]);
//
//        await expect(unsRegistryMock.setOwner(ZERO_ADDRESS, tokenId)).to.be.revertedWith(
//          'ERC721: transfer to the zero address',
//        );
//      });

      it('should not reset records on set owner', async () => {
        await proxy.set('key_16', 'value_23', tokenId);
        expect(await proxy.get('key_16', tokenId)).to.be.equal('value_23');

        await expect(proxy.setOwner(owner.address, tokenId))
          .to.not.emit(proxy, 'ResetRecords')
          .withArgs(tokenId);
        expect(await proxy.get('key_16', tokenId)).to.be.equal('value_23');
      });
    });

    describe('transferFrom', () => {
      it('transfers domain correctly', async () => {
        await proxy.transferFrom(coinbase.address, owner.address, tokenId);

        expect(await proxy.ownerOf(tokenId)).to.be.equal(owner.address);
      });

//      it('transfers domain correctly even if token is upgraded', async () => {
//        tokenId = await mintRandomDomain(unsRegistryMock, coinbase.address, 'crypto');
//        await unsRegistryMock.upgradeAll([tokenId]);
//
//        await unsRegistryMock.transferFrom(coinbase.address, owner.address, tokenId);
//
//        expect(await unsRegistryMock.ownerOf(tokenId)).to.be.equal(owner.address);
//      });

//      it('should reset records on transfer', async () => {
//        await proxy.set('key_23', 'value_23', tokenId);
//        expect(await proxy.get('key_23', tokenId)).to.be.equal('value_23');
//
//        await expect(proxy.transferFrom(admin.address, accounts[0], tokenId))
//          .to.emit(proxy, 'ResetRecords')
//          .withArgs(tokenId);
//
//        expect(await proxy.get('key_23', tokenId)).to.be.equal('');
//      });
//    });

//    describe('safeTransferFrom(address,address,uint256)', () => {
//      it('transfers domain correctly', async () => {
//        await unsRegistry['safeTransferFrom(address,address,uint256)'](coinbase.address, owner.address, tokenId);
//
//        expect(await unsRegistry.ownerOf(tokenId)).to.be.equal(owner.address);
//      });
//
//      it('transfers domain correctly even if token is upgraded', async () => {
//        tokenId = await mintRandomDomain(unsRegistryMock, coinbase.address, 'crypto');
//        await unsRegistryMock.upgradeAll([tokenId]);
//
//        await unsRegistryMock['safeTransferFrom(address,address,uint256)'](coinbase.address, owner.address, tokenId);
//
//        expect(await unsRegistryMock.ownerOf(tokenId)).to.be.equal(owner.address);
//      });
//
//      it('should reset records on safe transfer', async () => {
//        await unsRegistry.set('key_12', 'value_23', tokenId);
//        expect(await unsRegistry.get('key_12', tokenId)).to.be.equal('value_23');
//
//        await expect(unsRegistry['safeTransferFrom(address,address,uint256)'](coinbase.address, accounts[0], tokenId))
//          .to.emit(unsRegistry, 'ResetRecords')
//          .withArgs(tokenId);
//
//        expect(await unsRegistry.get('key_12', tokenId)).to.be.equal('');
//      });
//    });
//
//    describe('safeTransferFrom(address,address,uint256,bytes)', () => {
//      it('transfers domain correctly', async () => {
//        await unsRegistry['safeTransferFrom(address,address,uint256,bytes)'](
//          coinbase.address,
//          owner.address,
//          tokenId,
//          '0x',
//        );
//
//        expect(await unsRegistry.ownerOf(tokenId)).to.be.equal(owner.address);
//      });
//
//      it('transfers domain correctly even if token is upgraded', async () => {
//        tokenId = await mintRandomDomain(unsRegistryMock, coinbase.address, 'crypto');
//        await unsRegistryMock.upgradeAll([tokenId]);
//
//        await unsRegistryMock['safeTransferFrom(address,address,uint256,bytes)'](
//          coinbase.address,
//          owner.address,
//          tokenId,
//          '0x',
//        );
//
//        expect(await unsRegistryMock.ownerOf(tokenId)).to.be.equal(owner.address);
//      });
//
//      it('should reset records on safe transfer with data', async () => {
//        await unsRegistry.set('key_12', 'value_23', tokenId);
//        expect(await unsRegistry.get('key_12', tokenId)).to.be.equal('value_23');
//
//        await expect(
//          unsRegistry['safeTransferFrom(address,address,uint256,bytes)'](coinbase.address, accounts[0], tokenId, '0x'),
//        )
//          .to.emit(unsRegistry, 'ResetRecords')
//          .withArgs(tokenId);
//        expect(await unsRegistry.get('key_12', tokenId)).to.be.equal('');
//      });
//    });
  })

  describe('Registry resolver', function (){
    let tokenId;
    beforeEach(async () => {
      tokenId = await mintDomain(proxy, admin.address, ['test'], false, [], []);
    });

    it("set and get", async () => {
      it('should be able to set and resolve record', async () => {
        await proxy.set('key', 'value', tokenId);
      
        expect(await proxy.get('key', tokenId)).to.be.equal('value');
      });
      it('should fail if not owner', async () => {
        tokenId = await mintDomain(proxy, admin.address, ['test'], false, [], []);
        await expect(proxy.connect(bob).set('key', 'value', tokenId)).to.be.revertedWith(
          'Registry: SENDER_IS_NOT_APPROVED_OR_OWNER',
        );
      });

      it('should fail if token is not minted', async () => {
        const tokenId = await proxy.namehash(['test123', 'doid']);

        await expect(proxy.set('key', 'value', tokenId)).to.be.revertedWith('ERC721: invalid token ID');
      });

      it('should emit NewKey event new keys added', async () => {
        const key = 'new-key';
        const value = 'value';

        await expect(proxy.set(key, value, tokenId))
          .to.emit(proxy, 'NewKey')
          .withArgs(tokenId, utils.id(key), key);

        await expect(proxy.set(key, value, tokenId)).not.to.emit(proxy, 'NewKey');
      });

      it('should emit correct Set event', async () => {
        const key = 'new-key';
        const value = 'value';

        await expect(proxy.set(key, value, tokenId))
          .to.emit(proxy, 'Set')
          .withArgs(tokenId, utils.id(key), utils.id(value), key, value);
      });
    })

    describe('setMany & getMany', () => {
      it('should be able to set records multiple times and resolve them', async () => {
        await proxy.setMany(['key1'], ['value1'], tokenId);
        await proxy.setMany(['key2', 'key3'], ['value2', 'value3'], tokenId);
        await proxy.setMany(['key4', 'key5', 'key6'], ['value4', 'value5', 'value6'], tokenId);
        expect(await proxy.getMany(['key1', 'key2', 'key3', 'key4', 'key5', 'key6'], tokenId)).to.be.eql([
          'value1',
          'value2',
          'value3',
          'value4',
          'value5',
          'value6',
        ]);
      });

      it('should fail on setMany if not owner', async () => {
        await expect(proxy.connect(bob).setMany(['key'], ['value'], tokenId)).to.be.revertedWith(
          'Registry: SENDER_IS_NOT_APPROVED_OR_OWNER',
        );

        expect(await proxy.connect(bob).getMany(['key'], tokenId)).to.be.deep.equal(['']);
      });
    });

    describe('reset', () => {
      it('should reset all records', async () => {
        await proxy.setMany(['key1', 'key2'], ['value1', 'value2'], tokenId);

        await expect(proxy.reset(tokenId)).to.emit(proxy, 'ResetRecords').withArgs(tokenId.toString());

        expect(
          await proxy.getMany(['key1', 'key2'], tokenId),
        ).to.deep.equal(['', '']);
      });

      it('should fail if not owner', async () => {
        await proxy.setMany(['key1', 'key2'], ['value1', 'value2'], tokenId);

        await expect(proxy.connect(bob).reset(tokenId)).to.be.revertedWith(
          'Registry: SENDER_IS_NOT_APPROVED_OR_OWNER',
        );

        expect(
          await proxy.getMany(['key1', 'key2'], tokenId),
        ).to.deep.equal(['value1', 'value2']);
      });
    });

    describe('geyKey & getKeys', () => {
      it('should get key by hash', async () => {
        const expectedKey = 'new-hashed-key';
        await proxy.set(expectedKey, 'value', tokenId);

        const keyFromHash = await proxy.getKey(BigNumber.from(utils.id(expectedKey)));
        expect(keyFromHash).to.be.equal(expectedKey);
      });

      it('should get many keys by hashes', async () => {
        const expectedKeys = ['keyhash-many-1', 'keyhash-many-2'];
        await proxy.setMany(expectedKeys, ['value', 'value'], tokenId);

        const expectedKeyHashes = expectedKeys.map((key) => BigNumber.from(utils.id(key)));
        const keysFromHashes = await proxy.getKeys(expectedKeyHashes);
        expect(keysFromHashes).to.be.eql(expectedKeys);
      });
    });

    describe('reconfigure', () => {
      it('should reconfigure resolver with new values', async () => {
        await proxy.set('old-key', 'old-value', tokenId);
        await proxy.reconfigure(['new-key'], ['new-value'], tokenId);

        expect(await proxy.get('old-key', tokenId)).to.be.equal('');
        expect(await proxy.get('new-key', tokenId)).to.be.eql('new-value');
      });

      it('should fail when trying to reconfigure non-owned domain', async () => {
        await expect(
          proxy.connect(bob).reconfigure(['new-key'], ['new-value'], tokenId),
        ).to.be.revertedWith('Registry: SENDER_IS_NOT_APPROVED_OR_OWNER');
      });
    });

    describe('record operations by hashes', async () => {
      const initializeKey = async (key) => {
        await proxy.addKey(key);
        return ethers.BigNumber.from(ethers.utils.id(key));
      };

      it('should get value by key hash', async () => {
        const key = 'get-key-by-hash-key';
        const expectedValue = 'get-key-by-hash-value';
        await proxy.set(key, expectedValue, tokenId);

        const result = await proxy.getByHash(ethers.utils.id(key), tokenId);
        expect(result.value).to.be.equal(expectedValue);
        expect(result.key).to.be.equal(key);
      });

//      it('should return empty value by keyhash if reader is ProxyReader and token is upgraded', async () => {
//        const key = 'get-key-by-hash-key';
//        const value = 'get-key-by-hash-value';
//
//        tokenId = await mintDomain(unsRegistryMock, coinbase.address, 'crypto');
//        await unsRegistryMock.set(key, value, tokenId);
//        await unsRegistryMock.upgradeAll([tokenId]);
//
//        expect((await unsRegistryMock.connect(reader).getByHash(utils.id(key), tokenId)).value).to.be.equal('');
//
//        expect((await unsRegistryMock.connect(coinbase).getByHash(utils.id(key), tokenId)).value).to.be.equal(value);
//      });

      it('should get multiple values by hashes', async () => {
        const keys = ['key-to-hash-1', 'key-to-hash-2'];
        const expectedValues = ['value-42', 'value-43'];
        await proxy.setMany(keys, expectedValues, tokenId);

        const hashedKeys = keys.map((key) => BigNumber.from(utils.id(key)));
        const result = await proxy.getManyByHash(hashedKeys, tokenId);
        expect(result).to.be.eql([keys, expectedValues]);
      });

//      it('should return empty values by keyhashes if reader is ProxyReader and token is upgraded', async () => {
//        const keys = ['key-to-hash-1', 'key-to-hash-2'];
//        const values = ['value-42', 'value-43'];
//
//        tokenId = await mintRandomDomain(unsRegistryMock, coinbase.address, 'crypto');
//        await unsRegistryMock.setMany(keys, values, tokenId);
//        await unsRegistryMock.upgradeAll([tokenId]);
//
//        const hashedKeys = keys.map((key) => BigNumber.from(utils.id(key)));
//
//        const [, resultingValues] = await unsRegistryMock.connect(reader).getManyByHash(hashedKeys, tokenId);
//
//        expect(resultingValues).to.be.deep.equal(['', '']);
//
//        expect(
//          await unsRegistryMock.connect(coinbase).getManyByHash(hashedKeys, tokenId),
//        ).to.be.deep.equal([keys, values]);
//      });

      it('should set record by hash', async () => {
        const expectedKey = 'key_23c';
        const keyHash = await initializeKey(expectedKey);

        await proxy.setByHash(keyHash, 'value', tokenId);

        const [key, value] = await proxy.getByHash(keyHash, tokenId);
        expect([key, value]).to.be.eql([expectedKey, 'value']);
      });

      it('should revert setting record by hash when key is not registered', async () => {
        const expectedKey = 'key_23f3c';
        const keyHash = BigNumber.from(utils.id(expectedKey));

        await expect(proxy.setByHash(keyHash, 'value', tokenId)).to.be.revertedWith(
          'RecordStorage: KEY_NOT_FOUND',
        );
      });

      it('should set records(1) by hash', async () => {
        const expectedKey = 'key_2w12c';
        const keyHash = await initializeKey(expectedKey);

        await proxy.setManyByHash([keyHash], ['value'], tokenId);

        expect(await proxy.getByHash(keyHash, tokenId)).to.be.eql([expectedKey, 'value']);
      });

      it('should set records(2) by hash', async () => {
        const key1 = 'key_3m3c';
        const key2 = 'key_9v3f';
        const key1Hash = await initializeKey(key1);
        const key2Hash = await initializeKey(key2);

        await proxy.setManyByHash([key1Hash, key2Hash], ['value1', 'value2'], tokenId);

        expect(await proxy.getManyByHash([key1Hash, key2Hash], tokenId)).to.be.eql([
          [key1, key2],
          ['value1', 'value2'],
        ]);
      });

      it('should revert setting records by hash when at least one key is not registered', async () => {
        const key1 = 'key_2d83c';
        const key2 = 'key_4o83f';
        const key1Hash = await initializeKey(key1);
        const key2Hash = BigNumber.from(utils.id(key2));

        await expect(proxy.setManyByHash([key1Hash, key2Hash], ['value1', 'value2'], tokenId)).to.be.revertedWith(
          'RecordStorage: KEY_NOT_FOUND',
        );
      });

      it('should not consume additional gas if key hash was set before', async () => {
        const newKeyHashTx = await proxy.set(
          'keyhash-gas',
          'value',
          tokenId,
        );
        const newKeyHashTxReceipt = await newKeyHashTx.wait();
        const exitsKeyHashTx = await proxy.set(
          'keyhash-gas',
          'value',
          tokenId,
        );
        const exitsKeyHashTxReceipt = await exitsKeyHashTx.wait();

        expect(newKeyHashTxReceipt.gasUsed).to.be.above(
          exitsKeyHashTxReceipt.gasUsed,
        );

        const newKeyHashTx2 = await proxy.setMany(
          ['keyhash-gas-1', 'keyhash-gas-2'],
          ['value-1', 'value-2'],
          tokenId,
        );
        const newKeyHashTxReceipt2 = await newKeyHashTx2.wait();
        const exitsKeyHashTx2 = await proxy.setMany(
          ['keyhash-gas-1', 'keyhash-gas-2'],
          ['value-1', 'value-2'],
          tokenId,
        );
        const exitsKeyHashTxReceipt2 = await exitsKeyHashTx2.wait();

        expect(newKeyHashTxReceipt2.gasUsed).to.be.above(
          exitsKeyHashTxReceipt2.gasUsed,
        );

        const newKeyHashTx3 = await proxy.setMany(
          ['keyhash-gas-3', 'keyhash-gas-4', 'keyhash-gas-5'],
          ['value-1', 'value-2', 'value-3'],
          tokenId,
        );
        const newKeyHashTxReceipt3 = await newKeyHashTx3.wait();
        const exitsKeyHashTx3 = await proxy.setMany(
          ['keyhash-gas-3', 'keyhash-gas-4', 'keyhash-gas-5'],
          ['value-1', 'value-2', 'value-3'],
          tokenId,
        );
        const exitsKeyHashTxReceipt3 = await exitsKeyHashTx3.wait();

        expect(newKeyHashTxReceipt3.gasUsed).to.be.above(
          exitsKeyHashTxReceipt3.gasUsed,
        );
      });
    });
  })

  describe('Migrate from doid pass', function () {
    it('mintWithPassId', async function () {
    })

    it('mintWithPassIds', async function() {

    })
  })


})
