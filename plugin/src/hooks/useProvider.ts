import type React from 'react'
import { useState } from 'react'
import { type Provider, type ProviderInterface } from 'starknet'

const useProvider = (): {
  provider: Provider | ProviderInterface | null
  setProvider: React.Dispatch<React.SetStateAction<Provider | ProviderInterface | null>>
} => {
  const [provider, setProvider] = useState<Provider | ProviderInterface | null>(
    null
  )
  return { provider, setProvider }
}

export default useProvider
