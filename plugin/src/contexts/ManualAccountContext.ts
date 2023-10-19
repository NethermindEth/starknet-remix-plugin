import { createContext } from 'react'
import { type ManualAccount } from '../utils/types/accounts'
import { networks } from '../utils/constants'

const TransactionContext = createContext({
  accounts: [] as ManualAccount[],
  setAccounts: ((_: ManualAccount[]) => {}) as React.Dispatch<React.SetStateAction<ManualAccount[]>>,
  selectedAccount: null as ManualAccount | null,
  setSelectedAccount: ((_: ManualAccount | null) => {}) as React.Dispatch<React.SetStateAction<ManualAccount | null>>,
  networkName: networks[0].value,
  setNetworkName: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>
})

export default TransactionContext
