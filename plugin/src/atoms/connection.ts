import { atom } from 'jotai'
import {
  type AccountInterface,
  type ProviderInterface
} from 'starknet'

import { type StarknetWindowObject } from 'get-starknet'

const account = atom<AccountInterface | null>(null)
const provider = atom<ProviderInterface | null>(null)
const starknetWindowObject = atom<StarknetWindowObject | null>(null)

export { account, provider, starknetWindowObject }
