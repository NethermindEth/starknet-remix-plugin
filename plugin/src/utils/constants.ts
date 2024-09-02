import { constants } from 'starknet'
import { type Status } from '../atoms/deployment'

const devnetUrl = 'http://127.0.0.1:5050'

type Network = 'goerli' | 'sepolia' | 'mainnet'

const networks = [
  { name: 'Testnet', value: 'goerli' },
  { name: 'Sepolia', value: 'sepolia' },
  { name: 'Mainnet', value: 'mainnet' }
]

const networkExplorerUrls = {
  voyager: {
    goerli: 'https://goerli.voyager.online',
    sepolia: 'https://sepolia.voyager.online',
    mainnet: 'https://voyager.online'
  },
  starkscan: {
    goerli: 'https://testnet.starkscan.co',
    sepolia: 'https://sepolia.starkscan.co',
    mainnet: 'https://starkscan.co'
  }
}

const networkEquivalents = new Map([
  ['goerli', constants.StarknetChainId.SN_GOERLI],
  ['sepolia', constants.StarknetChainId.SN_SEPOLIA],
  ['mainnet', constants.StarknetChainId.SN_MAIN]
])

const networkEquivalentsRev = new Map([
  [constants.StarknetChainId.SN_GOERLI, 'goerli'],
  [constants.StarknetChainId.SN_SEPOLIA, 'sepolia'],
  [constants.StarknetChainId.SN_MAIN, 'mainnet']
])

const networkNameEquivalents = new Map([
  ['goerli', constants.NetworkName.SN_GOERLI],
  ['sepolia', constants.NetworkName.SN_SEPOLIA],
  ['mainnet', constants.NetworkName.SN_MAIN]
])

const networkNameEquivalentsRev = new Map([
  [constants.NetworkName.SN_GOERLI, 'goerli'],
  [constants.NetworkName.SN_SEPOLIA, 'sepolia'],
  [constants.NetworkName.SN_MAIN, 'mainnet']
])

const licenses = [
  'No License (None)',
  'The Unlicense (Unlicense)',
  'MIT License (MIT)',
  'GNU General Public License v2.0 (GNU GPLv2)',
  'GNU General Public License v3.0 (GNU GPLv3)',
  'GNU Lesser General Public License v2.1 (GNU LGPLv2.1)',
  'GNU Lesser General Public License v3.0 (GNU LGPLv3)',
  'BSD 2-clause "Simplified" license (BSD-2-Clause)',
  'BSD 3-clause "New" Or "Revisited license (BSD-3-Clause)',
  'Mozilla Public License 2.0 (MPL-2.0)',
  'Open Software License 3.0 (OSL-3.0)',
  'Apache 2.0 (Apache-2.0)',
  'GNU Affero General Public License (GNU AGPLv3)',
  'Business Source License (BSL 1.1)'
]

export const SCARB_VERSION_REF = 'c4c7c0bac3a30c23a4e2f1db145b967371b0e3c2'

export {
  devnetUrl,
  networks,
  networkExplorerUrls,
  networkEquivalents,
  networkEquivalentsRev,
  networkNameEquivalents,
  networkNameEquivalentsRev,
  licenses,
  constants
}

export type { Network }

export const DeclareStatusLabels: Record<Status, string> = {
  IDLE: 'Idle',
  IN_PROGRESS: 'Declaring...',
  ERROR: 'Error',
  DONE: 'Done'
}

export const DeployStatusLabels: Record<Status, string> = {
  IDLE: 'Idle',
  IN_PROGRESS: 'Deploying...',
  ERROR: 'Error',
  DONE: 'Done'
}
