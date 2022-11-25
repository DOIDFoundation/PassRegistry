const fs = require('fs')
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
      const wsB = fs.createWriteStream('codeBase.log')
      wsB.write('----Base----\n')
      const wsF = fs.createWriteStream('codeFoundation.log')
      wsF.write('----Foundation----\n')
      const wsC = fs.createWriteStream('codeCommunity.log')
      wsC.write('----Community----\n')
      const wsU = fs.createWriteStream('codeUser.log')
      wsU.write('----User----\n')
      const wsN = fs.createWriteStream('codeLockName.log')
      wsN.write('----LockName----\n')
      resultVec.forEach((item) => {
        let log
        try {
          log = iface.parseTransaction({ data: item.input })
        } catch (e) {
          return
        }
        let ws = null
        let from = ''
        switch (log.name) {
          case 'lockName':
            wsN.write(
              new Date(parseInt(item.timeStamp) * 1000).toISOString() + '\t',
            )
            wsN.write(item.from)
            wsN.write('\tuse pass\t')
            wsN.write(log.args[0].toString())
            wsN.write('\tfrom pass\t')
            wsN.write(passes[item.from].toString())
            wsN.write('\tto lock\t')
            wsN.write(log.args[1])
            wsN.write(parseInt(item.isError) ? '\t❌' : '\t')
            wsN.write('\n')
            break
          case 'lockPass':
            if (log.args[3] != 0) {
              if (!passes[item.from]) passes[item.from] = log.args[3]
              if (log.args[3] <= 300) {
                // From Codebase
                ws = wsB
              } else if (log.args[3] > 600 && log.args[3] <= 700) {
                // From foundation
                ws = wsF
              } else {
                // From community
                ws = wsC
              }
              from = '\tfrom\tfoundation\t '
            } else {
              // From User
              ws = wsU
              let inviteUser = ethers.utils
                .verifyMessage(ethers.utils.arrayify(CHash), log.args[0])
                .toLowerCase()
              from = '\tfrom\t' + inviteUser + '\t#' + passes[inviteUser]
            }
            if (ws) {
              ws.write(
                new Date(parseInt(item.timeStamp) * 1000).toISOString() + '\t',
              )
              ws.write(item.from)
              ws.write('\tuse code\t')
              ws.write(getClassName(log.args[2]))
              ws.write(from)
              ws.write('\twith pass\t')
              ws.write(log.args[3].toString())
              ws.write('\tand lock\t')
              ws.write(log.args[1])
              ws.write(parseInt(item.isError) ? '\t❌' : '\t')
              ws.write('\n')
            }
            break
        }
      })
      wsB.close()
      wsF.close()
      wsC.close()
      wsU.close()
    })
  }

  http.request(options_LockName, callback).end()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
