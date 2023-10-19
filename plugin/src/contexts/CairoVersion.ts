import type React from 'react'
import { createContext } from 'react'

const CairoVersion = createContext({
  version: '0.0.0' as string,
  setVersion: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>
})

export default CairoVersion
