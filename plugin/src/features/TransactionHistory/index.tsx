import React, { useContext } from 'react'
import Container from '../../components/ui_components/Container'
import TransactionContext from '../../contexts/TransactionContext'
import TransactionCard from './TransactionCard'
import { type IExplorerSelector } from '../../utils/misc'

const TransactionHistory: React.FC<IExplorerSelector> = (props) => {
  const { transactions } = useContext(TransactionContext)
  return (
    <Container>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {transactions.length === 0
          ? (
          <div>No transactions yet</div>
            )
          : (
              transactions.map((transaction, index) => {
                return <TransactionCard key={transaction.txId} transaction={transaction} explorer={props.controlHook.explorer} />
              })
            )}
      </div>
    </Container>
  )
}

export default TransactionHistory
