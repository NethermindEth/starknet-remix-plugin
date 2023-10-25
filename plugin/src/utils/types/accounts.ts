import { type BigNumberish } from 'ethers'

// type StarknetChainId = constants.StarknetChainId;

enum StarknetChainId {
  SN_MAIN = '0x534e5f4d41494e',
  SN_GOERLI = '0x534e5f474f45524c49',
  SN_GOERLI2 = '0x534e5f474f45524c4932',
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
  deployed_networks: string[]
}

export type { DevnetAccount, ManualAccount }

export { StarknetChainId }
