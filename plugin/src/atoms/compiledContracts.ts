import { atom } from 'jotai'

import { type Contract } from '../utils/types/contracts'

const compiledContractsAtom = atom<Contract[]>([])
const selectedCompiledContract = atom<Contract | null>(null)

export {
  compiledContractsAtom,
  selectedCompiledContract
}
