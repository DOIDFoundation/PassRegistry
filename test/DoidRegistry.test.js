require('@nomicfoundation/hardhat-chai-matchers')
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

      });


  })

  describe('Migrate from doid pass', function () {
    it('mintWithPassId', async function () {
    })

    it('mintWithPassIds', async function() {

    })
  })


})
