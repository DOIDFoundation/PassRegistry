// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat')
const fs = require('fs')
const { ethers, utils } = require('ethers')
const assert = require('assert')

const ETH_DOID_ADDR = '0xCB9302Da98405eCc50B1D6D4F9671F05E143B5F7'
// const RIF_DOID_ADDR = '0x4e01ea20AF674020185A01a48f25B83222f0047D'
const RIF_DOID_ADDR = '0x20507b80c92d32DDfd733E81aF255b549421dfd8'
const url = 'https://api.studio.thegraph.com/query/38900/as/3'

async function migrate() {
  const rif_doid = await hre.ethers.getContractAt('DoidRegistry', RIF_DOID_ADDR)
  const content = fs.readFileSync('./scripts/migration.data2')
  const contentArr = content.toString().split(/\r?\n/)
  for (let index = 0; index < contentArr.length; index++) {
    const line = contentArr[index]
    const items = line.split(' ')
    const addr = items[1]
    const name = items[2]
    console.log(`index:${index},addr:${addr}, name:${name}`)
    try {
      const tx = await rif_doid.nameMigration(name, addr)
    } catch (err) {
      console.log('tx error', err, addr, name)
      continue
    }
    // return await tx.wait()
  }
}

async function fetchNameList() {
  const content = fs.readFileSync('./scripts/migration.data')
  let contentVec = []

  let getAddress2 = async function (id) {
    const doid = await hre.ethers.getContractAt('DoidRegistry', ETH_DOID_ADDR)
    // const name = await doid.names(id)
    // const name2 = hex_to_ascii(name)
    // console.log('name:', name, name2)
    return await doid.addr(id)
  }

  content
    .toString()
    .split(/\r?\n/)
    .forEach(async (line) => {
      const pair = line.split(' ')
      const id = pair[0]
      const name = pair[1]
      const expId = utils.keccak256(utils.toUtf8Bytes(name))
      // assert(
      //   expId.trim().toLowerCase() === id.trim().toLowerCase(),
      //   `id not match ${name} ${id} ${expId} ${id.length} ${expId.length}`,
      // )
      contentVec.push([id, name])
    })
  console.log(`total lines:${contentVec.length}`)
  for (let index = 0; index < contentVec.length; index++) {
    const address = await getAddress2(
      utils.hexZeroPad(contentVec[index][0], 32),
    )
    console.log(contentVec[index][0], address, contentVec[index][1])
    // const tx = await migrate(contentVec[index][1], address)
    // await getAddress2(contentVec[index])
    // const element = array[index];
    // const id = contentVec[index][0]
    // const name = contentVec[index][1]
  }

  // let getAddress = async function (idArray) {
  //   strArray = ''
  //   idArray.map(function (id, n) {
  //     strArray += `"${id}",`
  //   })
  //   console.log(strArray)
  //   const query = {
  //     query: `{doids (\
  //   where: {id_in:[${strArray}]} ){\
  //   address {id}\
  //   owner {id}\
  //   name}}`,
  //   }
  //   console.log(query)
  //   const resp = await fetch(url, {
  //     body: JSON.stringify(query),
  //     headers: { 'Content-Type': 'application/json; charset=utf-8' },
  //     method: 'POST',
  //   })
  //   console.log(resp.statusText)
  //   console.log(await resp.json())
  // }
}

async function fetchAddressByName() {
  var page = 0
  const pageSize = 200
  while (page < 10) {
    const query = {
      query: `{doids(first:${pageSize}, skip:${pageSize * page}){id name}}`,
    }
    page += 1
    console.log('...querying page:', page)

    const resp = await fetch(url, {
      body: JSON.stringify(query),
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      method: 'POST',
    })
    if (resp.ok) {
      const data = await resp.json()
      const doids = data['data']['doids']
      doids.forEach((doid) => {
        const id = doid['id']
        const name = doid['name']
        console.log(id, name)
      })
    } else {
      console.log('error response', resp.statusText)
      return
    }
  }
}

async function main() {
  const accounts = await hre.ethers.getSigners()
  admin = accounts[0]
  console.log('admin:', admin.address)

  console.log(await migrate('nunocostapt', admin.address))

  // await fetchNameList()
}

function hex_to_ascii(str1) {
  var hex = str1.toString()
  var str = ''
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16))
  }
  return str
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
