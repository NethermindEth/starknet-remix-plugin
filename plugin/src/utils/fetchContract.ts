import fetch from 'node-fetch'

const RPC_ENDPOINT = 'https://starknet-devnet2.io'

async function fetchClass(classHash: string) {
  const response = await fetch(`${RPC_ENDPOINT}/starknet_getClass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      class_hash: classHash
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.result
}

async function fetchAddress(contractAddress: string) {
  const response = await fetch(`${RPC_ENDPOINT}/starknet_getClassHashAt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contract_address: contractAddress
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  const classHash = data.result
  const contractClass = await fetchClass(classHash)
  return contractClass
}

export { fetchClass, fetchAddress }
