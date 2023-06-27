import React, { useContext } from 'react'
import Container from '../../ui_components/Container'
import TransactionContext from '../../contexts/TransactionContext'

const TransactionHistory: React.FC = () => {
  const { transactions } = useContext(TransactionContext)
  return (
    <Container>
      {transactions.length === 0
        ? <div>No transactions yet</div>
        : transactions.map((transaction, index) => {
          return (
            <div key={index}>
              <div>type: {transaction.type}</div>
              <div>TxId: {transaction.txId}</div>
              <div>Acc: {transaction.account?.address}</div>
            </div>
          )
        })
      }
    </Container>
  )
}

export default TransactionHistory
