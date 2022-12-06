
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function mintDomain (
    proxy,
    owner,
    labels,
    withoutReverse,
    keys,
    values,
  ) {
    await proxy.mintWithRecords(
        owner,
        labels,
        keys,
        values,
        withoutReverse
    )

  
    return await proxy.namehash(labels);
}

module.exports = {
    ZERO_ADDRESS,
    mintDomain
}