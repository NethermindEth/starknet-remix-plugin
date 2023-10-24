import { atom } from 'jotai'

import { type Devnet, devnets, type DevnetAccount } from '../utils/network'

const devnetAtom = atom<Devnet>(devnets[0])

const envAtom = atom<'remoteDevnet' | 'wallet' | 'manual' | 'localDevnet'>('remoteDevnet')

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
