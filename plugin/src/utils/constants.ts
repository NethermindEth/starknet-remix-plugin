import { constants } from 'starknet'

const devnetUrl = 'http://127.0.0.1:5050'

type Network =
  | 'goerli-alpha'
  | 'mainnet-alpha'

const networks = [
  { name: 'Testnet', value: 'goerli-alpha' },
  { name: 'Mainnet', value: 'mainnet-alpha' }
]

const networkExplorerUrls = {
  voyager: {
    'goerli-alpha': 'https://goerli.voyager.online',
    'mainnet-alpha': 'https://voyager.online'
  },
  starkscan: {
    'goerli-alpha': 'https://testnet.starkscan.co',
    'mainnet-alpha': 'https://starkscan.co'
  }
}

const networkEquivalents = new Map([
  ['goerli-alpha', constants.StarknetChainId.SN_GOERLI],
  ['mainnet-alpha', constants.StarknetChainId.SN_MAIN]
])

const networkEquivalentsRev = new Map([
  [constants.StarknetChainId.SN_GOERLI, 'goerli-alpha'],
  [constants.StarknetChainId.SN_MAIN, 'mainnet-alpha']
])

const networkNameEquivalents = new Map([
  ['goerli-alpha', constants.NetworkName.SN_GOERLI],
  ['mainnet-alpha', constants.NetworkName.SN_MAIN]
])

const networkNameEquivalentsRev = new Map([
  [constants.NetworkName.SN_GOERLI, 'goerli-alpha'],
  [constants.NetworkName.SN_MAIN, 'mainnet-alpha']
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

export {
  devnetUrl,
  networks,
  networkExplorerUrls,
  networkEquivalents,
  networkEquivalentsRev,
  networkNameEquivalents,
  networkNameEquivalentsRev,
  licenses, constants
}

export type { Network }
