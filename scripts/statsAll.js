const hre = require('hardhat')
const http = require('http')

async function main() {
  let abi = [
    'event LockPass(address user, uint passNumber)',
    'event LockName(address user, uint passId, string name)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  ]
  let iface = new ethers.utils.Interface(abi)

  const fromBlock = 16011148
  const contractAddr = '0x8b2afF81fec4E7787AeeB257b5D99626651Ee43F'
  const apikey = process.env.ETHERSCAN_API_KEY

  var options_All = {
    host: 'api.etherscan.io',
    path:
      '/api?module=logs&action=getLogs' +
      `&fromBlock=${fromBlock}&toBlock=latest&address=${contractAddr}` +
      `&page=1&offset=1000&apikey=${apikey}`,
  }

  callback3 = function (response) {
    var str = ''
    //another chunk of data has been received, so append it to `str`
    response.on('data', function (chunk) {
      str += chunk
    })

    //the whole response has been received, so we just print it out here
    response.on('end', function () {
      var jdata = JSON.parse(str)
      var resultVec = jdata['result']
      console.log('number of events:', resultVec.length)
      resultVec.forEach((item) => {
        let log
        try {
          log = iface.parseLog(item)
        } catch (e) {
          return
        }
        switch (log.name) {
          case 'LockPass':
            console.log(
              new Date(parseInt(item.timeStamp) * 1000),
              log.args.user,
              'use code',
            )
            break
          case 'Transfer':
            console.log(
              new Date(parseInt(item.timeStamp) * 1000),
              log.args.to,
              'got pass',
              log.args.tokenId.toString().padEnd(6),
              log.args.from != '0x0000000000000000000000000000000000000000'
                ? 'from'
                : '',
              log.args.from != '0x0000000000000000000000000000000000000000'
                ? log.args.from
                : '',
            )
            break
          case 'LockName':
            let { user, passId, name } = log.args
            console.log(
              new Date(parseInt(item.timeStamp) * 1000),
              user,
              'use pass',
              passId.toString().padEnd(6),
              'to lock name:',
              name,
            )
            break
        }
      })
    })
  }
  http.request(options_All, callback3).end()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
