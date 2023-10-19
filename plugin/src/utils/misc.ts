// Set of functions I thought I might need to use in the future.
// TODO: erase if not neeeded.

import { Provider } from 'starknet'
import { devnetUrl } from './constants'

const getProvider = (network: string): Provider => {
  switch (network) {
    case 'mainnet-alpha':
      return new Provider({
        sequencer: { baseUrl: 'https://sequencer.starknet.io' }
      })
    case 'goerli-alpha':
      return new Provider({
        sequencer: { baseUrl: 'https://goerli.starknet.io' }
      })
    case 'goerli-alpha-2':
      return new Provider({
        sequencer: { baseUrl: 'https://goerli.starknet.io' }
      })
    case devnetUrl:
      return new Provider({
        // TODO: Let user chose port eventually.
        sequencer: { baseUrl: devnetUrl }
      })
    default:
      return new Provider({
        sequencer: { baseUrl: 'https://goerli.starknet.io' }
      })
  }
}

interface IExplorerSelector {
  path?: string
  text?: string
  title?: string
  isInline?: boolean
  isNetworkVisible?: boolean
  isTextVisible?: boolean
  controlHook: IUseCurrentExplorer
}

interface IUseCurrentExplorer {
  explorer: 'voyager' | 'starkscan'
  setExplorer: React.Dispatch<React.SetStateAction<'voyager' | 'starkscan'>>
}

export { getProvider, type IExplorerSelector, type IUseCurrentExplorer }
