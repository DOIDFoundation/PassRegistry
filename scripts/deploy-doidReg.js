// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const PASS_REGISTRY = ""
const TEST_PASS_REGISTRY = "0x208ec0Ef36E94F582841296dcA6F6B61d5823fBE"
const TEST_DOID_REGISTRY = "0x24256dAb379962842691Eb8bcE11f2b5032bf1b6"

async function main() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log("admin:", admin.address)

  if (true){
    const DDNSRegistry = await hre.ethers.getContractFactory('DoidRegistry')
    const ddns = await upgrades.upgradeProxy(TEST_DOID_REGISTRY, DDNSRegistry)
    console.log("upgrade proxy", ddns.address)
    return
  }
  if (false) {
    const proxy = await hre.ethers.getContractAt('DoidRegistry', TEST_DOID_REGISTRY)
    const name = "tianqibucuo"
    const owner = admin.address
    const secret = ethers.utils.formatBytes32String("secret1")
    const data = []
    const commit = await proxy.makeCommitment(
        name,
        owner,
        secret,
        data
    )
    console.log("commit", commit, "secret,", secret)

    const coinType2 = 0x800000000 | 56
    const timestamp = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp
    const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(32))

    let signature = admin.signMessage(
      await proxy.makeAddrMessage(
        name,
        coinType2,
        admin.address,
        timestamp,
        nonce,
      ),
    )

    await proxy.setAddr(
        name,
        coinType2,
        admin.address,
        timestamp,
        nonce,
        signature,
      )
    return

    //commit
    //const tx = await proxy.commit(commit)

    // register
    await proxy.register(name, admin.address, secret, data)
    return
  }

  const DoidRegistry = await hre.ethers.getContractFactory('DoidRegistry')
  const proxy = await upgrades.deployProxy(DoidRegistry, [TEST_PASS_REGISTRY, 60, 86400])
  await proxy.deployed()

  console.log(
    `✅deploy DoidRegistry ${proxy.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
