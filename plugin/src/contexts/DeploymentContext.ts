import type React from 'react'
import { createContext } from 'react'
import { type Input, type CallDataObject } from '../types/contracts'

const DeploymentContext = createContext({
  isDeploying: false as boolean,
  setIsDeploying: ((_: boolean) => {}) as React.Dispatch<React.SetStateAction<boolean>>,
  deployStatus: '' as string,
  setDeployStatus: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>,
  constructorCalldata: {} satisfies CallDataObject,
  setConstructorCalldata: ((_: CallDataObject) => {}) as React.Dispatch<React.SetStateAction<CallDataObject>>,
  constructorInputs: [] as Input[],
  setConstructorInputs: ((_: Input[]) => {}) as React.Dispatch<React.SetStateAction<Input[]>>,
  notEnoughInputs: false as boolean,
  setNotEnoughInputs: ((_: boolean) => {}) as React.Dispatch<React.SetStateAction<boolean>>
})

export default DeploymentContext
