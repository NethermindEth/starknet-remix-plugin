import type React from 'react'
import { type Provider, type ProviderInterface } from 'starknet'
import { provider as atomProvider } from '../atoms/connection'
import { useAtom } from 'jotai'

const useProvider = (): {
  provider: Provider | ProviderInterface | null
  setProvider: React.Dispatch<React.SetStateAction<Provider | ProviderInterface | null>>
} => {
  const [provider, setProvider] = useAtom(atomProvider)
  return { provider, setProvider }
}

export default useProvider
