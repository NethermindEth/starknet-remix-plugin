import type React from 'react'
import { createContext } from 'react'
import { type Devnet, devnets, type DevnetAccount } from '../utils/network'
import { type StarknetWindowObject } from 'get-starknet'

const EnvironmentContext = createContext({
  devnet: devnets[0],
  setDevnet: ((_: Devnet) => {}) as React.Dispatch<React.SetStateAction<Devnet>>,
  env: 'remoteDevnet' as string,
  setEnv: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>,
  isDevnetAlive: true as boolean,
  setIsDevnetAlive: ((_: boolean) => {}) as React.Dispatch<React.SetStateAction<boolean>>,
  starknetWindowObject: null as (StarknetWindowObject | null),
  setStarknetWindowObject: ((_: StarknetWindowObject | null) => {}) as React.Dispatch<React.SetStateAction<StarknetWindowObject | null>>,
  selectedDevnetAccount: null as (DevnetAccount | null),
  setSelectedDevnetAccount: ((_: DevnetAccount | null) => {}) as React.Dispatch<React.SetStateAction<DevnetAccount | null>>,
  availableDevnetAccounts: [] as DevnetAccount[],
  setAvailableDevnetAccounts: ((_: DevnetAccount[]) => {}) as React.Dispatch<React.SetStateAction<DevnetAccount[]>>
})

export default EnvironmentContext
