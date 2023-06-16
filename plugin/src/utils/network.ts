import { type DevnetAccount } from '../types/accounts'

const apiUrl = process.env.REACT_APP_API_URL
const devnetUrl = process.env.REACT_APP_DEVNET_URL ?? 'http://localhost:5050'
const remoteDevnetUrl = process.env.REACT_APP_REMOTE_DEVNET_URL ?? 'https://starknet-devnet-dev.nethermind.io'

interface Devnet {
  name: string
  url: string
}

const devnets: Devnet[] = [
  {
    name: 'Local Devnet',
    url: devnetUrl,
  },
  {
    name: 'Remote Devnet',
    url: remoteDevnetUrl, 
  }
]

const getAccounts = async (
  customDevnetUrl: string = devnetUrl
): Promise<DevnetAccount[]> => {
  const response = await fetch(`${devnetUrl}/predeployed_accounts`)
  const accounts: DevnetAccount[] = await response.json()
  return accounts
}

const getAccountBalance = async (
  address: string,
  customDevnetUrl: string = devnetUrl
): Promise<any> => {
  const response = await fetch(
    `${devnetUrl}/account_balance?address=${address}`
  )
  const account = await response.json()
  return account.balance
}

const getDevnetUrl = (network: string): string => {
  const devnet = devnets.find((devnet) => devnet.name === network)
  if (devnet == null) throw new Error('Devnet not found')
  return devnet.url
}

const getDevnetName = (url: string): string => {
  const devnet = devnets.find((devnet) => devnet.url === url)
  if (devnet == null) throw new Error('Devnet not found')
  return devnet.name
}

const getDevnetIndex = (devnets: Devnet[], devnet: Devnet): number => {
  return devnets.findIndex((item) => item.name === devnet.name)
}

export {
  apiUrl,
  devnetUrl,
  devnets,
  getAccounts,
  getAccountBalance,
  getDevnetUrl,
  getDevnetName,
  getDevnetIndex
}

export type { Devnet, DevnetAccount }
