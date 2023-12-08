require('dotenv/config')
//require('@nomiclabs/hardhat-truffle5')
//require('@nomiclabs/hardhat-waffle')
require('@openzeppelin/hardhat-upgrades')
require('@nomiclabs/hardhat-web3')
require('@nomiclabs/hardhat-etherscan')
//require('hardhat-gas-reporter')
//require('solidity-coverage')

if (process.env.PROXY) {
  // set proxy for hardhat-etherscan
  const { setGlobalDispatcher, request, ProxyAgent } = require('undici')

  const proxyAgent = new ProxyAgent(process.env.PROXY)
  setGlobalDispatcher(proxyAgent)
}

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
      url: process.env.NETWORK_INFURA_URL_MAINNET,
      accounts: accounts(),
    },
    goerli: {
      gasPrice: 3000000000,
      url: process.env.NETWORK_INFURA_URL_GOERLI,
      accounts: accounts(),
    },
    sepolia: {
      url: process.env.NETWORK_INFURA_URL_SEPOLIA,
      accounts: accounts(),
    },
    fantomtestnet: {
      chainId: 4002,
      url: process.env.NETWORK_INFURA_URL_FANTOMTESTNET,
      accounts: accounts(),
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
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
