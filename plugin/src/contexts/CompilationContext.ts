import type React from 'react'
import { createContext } from 'react'

const CompilationContext = createContext({
  status: 'Compiling...' as string,
  setStatus: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>,
  currentFilename: '' as string,
  setCurrentFilename: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>,
  isCompiling: false as boolean,
  setIsCompiling: ((_: boolean) => {}) as React.Dispatch<React.SetStateAction<boolean>>,
  isValidCairo: false as boolean,
  setIsValidCairo: ((_: boolean) => {}) as React.Dispatch<React.SetStateAction<boolean>>,
  noFileSelected: false as boolean,
  setNoFileSelected: ((_: boolean) => {}) as React.Dispatch<React.SetStateAction<boolean>>,
  hashDir: '' as string,
  setHashDir: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>
})

export default CompilationContext
