const ethers = require('ethers')
const http = require('http')

async function main() {
  let abi = [
    'event LockPass(address user, uint passNumber)',
    'event LockName(address user, uint passId, string name)',
    'event Transfer(address from, address to, uint tokenId)',
  ]
  let iface = new ethers.utils.Interface(abi)

  const fromBlock = 16011148
  const contractAddr = '0x8b2afF81fec4E7787AeeB257b5D99626651Ee43F'
  const lockNameTopic =
    '0xe027feb30eed511dd4e4d2b66336f11312e4d33989a51f4891ee80a5a98e9508' // LockName event
  const apikey = process.env.ETHERSCAN_API_KEY
  var options_LockName = {
    host: 'api.etherscan.io',
    path:
      '/api?module=logs&action=getLogs' +
      `&fromBlock=${fromBlock}&toBlock=latest&address=${contractAddr}` +
      `&topic0=${lockNameTopic}&page=1&offset=1000&apikey=${apikey}`,
  }

  callback = function (response) {
    var str = ''
    //another chunk of data has been received, so append it to `str`
    response.on('data', function (chunk) {
      str += chunk
    })

    //the whole response has been received, so we just print it out here
    response.on('end', function () {
      var jdata = JSON.parse(str)
      var resultVec = jdata['result']
      console.log('lockName number:', resultVec.length)
      resultVec.forEach((item) => {
        let log = iface.parseLog(item)
        const { user, passId, name } = log.args
        console.log(
          'sender\t',
          user,
          '\tpassId\t',
          passId.toString().padEnd(6),
          '\tpassName\t',
          name,
        )
      })
    })
  }

  http.request(options_LockName, callback).end()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
