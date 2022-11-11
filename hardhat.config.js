require('dotenv/config')
//require('@nomiclabs/hardhat-truffle5')
//require('@nomiclabs/hardhat-waffle')
require('@openzeppelin/hardhat-upgrades')

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

function accounts() {
  privatekey = process.env.PrivateKey
  if (!privatekey)
    return {
      mnemonic: 'test test test test test test test test test test test junk',
    }
  return [privatekey]
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: 'hardhat',
  namedAccounts: {
    deployer: {
      default: 0,
    },
    proxyOwner: {
      default: 1,
    },
  },
  networks: {
    hardhat: {},
    localhost: {
      url: 'http://127.0.0.1:8545',
      accounts: accounts(),
    },
    sep: {
      url: 'https://sep',
      accounts: accounts(),
    },
    online: {
      chainId: 1,
      url: 'https://mainnet',
      accounts: accounts(),
    },
  },

  solidity: {
    compilers: [
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
}
