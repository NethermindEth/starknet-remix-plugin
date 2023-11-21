import type React from 'react'
import { type ProviderInterface } from 'starknet'
import { provider as atomProvider } from '../atoms/connection'
import { useAtom } from 'jotai'

const useProvider = (): {
  provider: ProviderInterface | null
  setProvider: React.Dispatch<React.SetStateAction<ProviderInterface | null>>
} => {
  const [provider, setProvider] = useAtom(atomProvider)
  return { provider, setProvider }
}

export default useProvider
