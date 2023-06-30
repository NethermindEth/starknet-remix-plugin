import { type BigNumberish } from 'ethers'
import { type ProviderInterface, type AccountInterface } from 'starknet'

// type StarknetChainId = constants.StarknetChainId;

enum StarknetChainId {
  SN_MAIN = '0x534e5f4d41494e',
  SN_GOERLI = '0x534e5f474f45524c49',
  SN_GOERLI2 = '0x534e5f474f45524c4932',
}

type Account = (AccountInterface & { icon: string }) | undefined

type Provider = ProviderInterface | undefined

interface Connection {
  connected: boolean
  account: Account
  provider: Provider
  network: string
}

interface DevnetAccount {
  initial_balance: number
  address: string
  private_key: string
  public_key: string
}

interface ManualAccount {
  address: string
  private_key: string
  public_key: string
  balance: BigNumberish
  deployed: boolean
}

export type { Account, Connection, Provider, DevnetAccount, ManualAccount }

export { StarknetChainId }
