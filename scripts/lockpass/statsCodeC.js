const ethers = require('ethers')
const http = require('http')

const AHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('A'))
const BHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('B'))
const CHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('C'))

function getClassName(classHash) {
  switch (classHash) {
    case AHash:
      return 'A'
    case BHash:
      return 'B'
    case CHash:
      return 'C'
  }
}

function getInviter(sig) {
  try {
    if (sig.length < 100) {
      return ethers.utils.hexValue(BigInt(sig) ^ BigInt(CHash)).toLowerCase()
    } else
      return ethers.utils
        .verifyMessage(ethers.utils.arrayify(CHash), sig)
        .toLowerCase()
  } catch (e) {
    console.error('Error retrieving inviter from sig:', sig, 'with exception:')
    console.error(e)
  }
}

async function main() {
  let abi = [
    'event LockPass(address user, uint passNumber)',
    'event LockName(address user, uint passId, string name)',
    'event Transfer(address from, address to, uint tokenId)',
    'function lockPass(bytes memory _invitationCode, string memory _name, bytes32 _classHash, uint _passId)',
    'function lockName(uint _passId, string memory _name)',
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
      '/api?module=account&action=txlist&sort=asc' +
      `&startblock=${fromBlock}&toBlock=latest&address=${contractAddr}` +
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
      var passes = {}
      resultVec.forEach((item) => {
        let log
        try {
          log = iface.parseTransaction({ data: item.input })
        } catch (e) {
          return
        }
        switch (log.name) {
          case 'lockPass':
            if (log.args[3] != 0) {
              if (!passes[item.from]) passes[item.from] = log.args[3]
              break
            }
            console.log(
              new Date(parseInt(item.timeStamp) * 1000),
              item.from,
              'use code',
              getClassName(log.args[2]),
              (
                'from ' +
                getInviter(log.args[0]) +
                '(#' +
                passes[getInviter(log.args[0])] +
                ')'
              ).padEnd(55),
              'with pass',
              log.args[3].toString(),
              'and lock',
              log.args[1],
              parseInt(item.isError) ? '❌' : '',
            )
            break
        }
      })
    })
  }

  http.request(options_LockName, callback).end()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
