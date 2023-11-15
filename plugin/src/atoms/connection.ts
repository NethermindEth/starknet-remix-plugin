import { atom } from 'jotai'
import {
  type Account,
  type AccountInterface,
  type Provider,
  type ProviderInterface
} from 'starknet'

import { type StarknetWindowObject } from 'get-starknet'

const account = atom<Account | AccountInterface | null>(null)
const provider = atom<Provider | ProviderInterface | null>(null)
const starknetWindowObject = atom<StarknetWindowObject | null>(null)

export { account, provider, starknetWindowObject }
