import { atomWithStorage } from 'jotai/utils'
import { AbiElement, Input } from '../types/contracts'
import {
  CallContractResponse,
  InvokeTransactionReceiptResponse
} from 'starknet'

const STORAGE_KEYS = {
  INTERACT: 'INTERACT'
}

export type EnhancedInput = Input & {
  rawInput?: string
}

export type EnhancedAbiElement = Omit<AbiElement, 'inputs'> & {
  callResponse?: CallContractResponse
  invocationResponse?: InvokeTransactionReceiptResponse
  inputs: EnhancedInput[]
}

export type UiAbiState = {
  readState: EnhancedAbiElement[]
  writeState: EnhancedAbiElement[]
}

const interactAtom = atomWithStorage<Record<string, UiAbiState>>(
  STORAGE_KEYS.INTERACT,
  {}
)

export { interactAtom }
