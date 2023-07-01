import { atomWithStorage } from 'jotai/utils'
import { AbiElement } from '../types/contracts'

const STORAGE_KEYS = {
  INTERACT: 'INTERACT'
}

type EnhancedAbiElement = AbiElement & {}

type AbiState = {
  readState: EnhancedAbiElement[]
  writeState: EnhancedAbiElement[]
}

const interactAtom = atomWithStorage<Record<string, AbiState>>(
  STORAGE_KEYS.INTERACT,
  {}
)

export { interactAtom }
