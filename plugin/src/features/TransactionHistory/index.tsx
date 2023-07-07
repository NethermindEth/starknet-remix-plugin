import React, { useContext } from 'react'
import Container from '../../ui_components/Container'
import TransactionContext from '../../contexts/TransactionContext'
import TransactionCard from './TransactionCard'

const TransactionHistory: React.FC = () => {
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
                return <TransactionCard key={transaction.txId} {...transaction}/>
              })
            )}
      </div>
    </Container>
  )
}

export default TransactionHistory
