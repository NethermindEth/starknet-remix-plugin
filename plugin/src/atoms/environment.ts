import { atom } from 'jotai'

import { type Devnet, devnets, type DevnetAccount } from '../utils/network'

const devnetAtom = atom<Devnet>(devnets[1])

export type Env = 'remoteDevnet' | 'wallet' | 'manual' | 'localDevnet' | 'localKatanaDevnet'

const envAtom = atom<Env>('remoteDevnet')

const isDevnetAliveAtom = atom<boolean>(true)

const selectedDevnetAccountAtom = atom<DevnetAccount | null>(null)

const availableDevnetAccountsAtom = atom<DevnetAccount[]>([])

export {
  devnetAtom,
  envAtom,
  isDevnetAliveAtom,
  selectedDevnetAccountAtom,
  availableDevnetAccountsAtom
}
