import { atom } from 'jotai'

import { type Devnet, devnets, type DevnetAccount } from '../utils/network'

const devnetAtom = atom<Devnet>(devnets[1])

export type Env = 'remoteDevnet' | 'wallet' | 'manual' | 'localDevnet' | 'localKatanaDevnet'

export const envName = (env: Env): string => {
  switch (env) {
    case 'remoteDevnet':
      return 'Remote Devnet'
    case 'wallet':
      return 'Wallet'
    case 'manual':
      return 'Manual'
    case 'localDevnet':
      return 'Local Devnet'
    case 'localKatanaDevnet':
      return 'Local Katana Devnet'
    default:
      return 'Unknown'
  }
}

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
