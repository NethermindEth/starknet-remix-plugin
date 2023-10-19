import { createContext } from 'react'
import { type Transaction } from '../utils/types/transaction'

const TransactionContext = createContext({
  transactions: [] as Transaction[],
  setTransactions: ((_: Transaction[]) => {}) as React.Dispatch<React.SetStateAction<Transaction[]>>
})

export default TransactionContext
