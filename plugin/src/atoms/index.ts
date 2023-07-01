import { atomWithStorage } from 'jotai/utils'
import { AbiElement } from '../types/contracts'
import { CallContractResponse, GetTransactionReceiptResponse, InvokeTransactionReceiptResponse } from 'starknet'

const STORAGE_KEYS = {
  INTERACT: 'INTERACT'
}

export type EnhancedAbiElement = AbiElement & {
  callResponse?: CallContractResponse
  invocationResponse?: InvokeTransactionReceiptResponse
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
