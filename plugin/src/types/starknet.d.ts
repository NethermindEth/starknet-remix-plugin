import {
  type Provider as TempProvider,
  type AccountInterface as TempAccountInterface,
  type StarknetChainId
} from 'starknet'

declare module 'starknet' {
  export interface AccountInterface extends TempAccountInterface {
    provider?: Provider
  }

  export interface Provider extends TempProvider {
    baseUrl: string
    chainId: StarknetChainId
  }
}
