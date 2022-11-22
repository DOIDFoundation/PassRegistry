const hre = require("hardhat");
const http = require('http');

async function main() {

    let abi = [ "event LockPass(address user, uint passNumber)",
                "event LockName(address user, uint passId, string name)",
                "event Transfer(address from, address to, uint tokenId)"];
    let iface = new ethers.utils.Interface(abi);

    const fromBlock = 16011148
    const contractAddr = '0x8b2afF81fec4E7787AeeB257b5D99626651Ee43F'
    const lockNameTopic = '0xe027feb30eed511dd4e4d2b66336f11312e4d33989a51f4891ee80a5a98e9508' // LockName event
    const apikey = process.env.ETHERSCAN_API_KEY
    var options_LockName = {
        host:'api.etherscan.io',
        path: '/api?module=logs&action=getLogs'+
            `&fromBlock=${fromBlock}&toBlock=latest&address=${contractAddr}`+
            `&topic0=${lockNameTopic}&page=1&offset=1000&apikey=${apikey}`
    };

    callback = function(response) {
      var str = '';
      //another chunk of data has been received, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });

      //the whole response has been received, so we just print it out here
      response.on('end', function () {
        var jdata = JSON.parse(str);
        var resultVec = jdata['result']
        console.log("lockName number:", resultVec.length)
        resultVec.forEach(item => {
            let log = iface.parseLog(item);
            const {user, passId, name} = log.args;
            console.log(`sender:${user}, passId:${passId}, passName:${name}`)
        });
      });
    }

    const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    var options_Transfer = {
        host:'api.etherscan.io',
        path: '/api?module=logs&action=getLogs'+
            `&fromBlock=${fromBlock}&toBlock=latest&address=${contractAddr}`+
            `&topic0=${transferTopic}&page=1&offset=1000&apikey=${apikey}`
    };
    callback2 = function(response) {
      var str = '';
      //another chunk of data has been received, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });

      //the whole response has been received, so we just print it out here
      response.on('end', function () {
        var jdata = JSON.parse(str);
        var resultVec = jdata['result']
        console.log("Transfer times:", resultVec.length)
        resultVec.forEach(item => {
            //let log = iface.parseLog(item);
            const from = item["topics"][1]
            const to = item["topics"][2]
            const passId = Number.parseInt(item["topics"][3])
            if(from == "0x0000000000000000000000000000000000000000000000000000000000000000"){
                console.log(`mint, to:${to}, passId:${passId}`)
            }else if (to == "0x0000000000000000000000000000000000000000000000000000000000000000"){
                console.log("burn")
            }else{
                console.log(`user transfer from:${from}, to:${to}, passId:${passId}`)
            }
        });
      });
    }

    http.request(options_LockName, callback).end();
    http.request(options_Transfer, callback2).end();

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
