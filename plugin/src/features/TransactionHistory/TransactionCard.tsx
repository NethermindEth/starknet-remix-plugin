import React from 'react'
import { Transaction } from '../../types/transaction'
import './transactioncard.css'

const Tag: React.FC<{ type: 'deploy' | 'declare' | 'invoke' }> = ({ type }) => {
  return <span className={`p-2 tag tag-${type}`}>{type}</span>
}

const trimAddress = (str?: string, strip?: number) => {
  if (!str) {
    return ''
  }
  const length = str.length
  return `${str?.slice(0, strip || 6)}...${str?.slice(length - (strip || 6))}`
}

const TransactionCard: React.FC<Transaction> = ({ account, txId, type }) => {
  return (
    <div className="maincard">
      <div className="tag-wrapper">
        <Tag type={type} />
      </div>
      <div className="account-wrapper">
        <p title={account?.address}>
          From:{' '}
          <a href="https://voyager.online" target="_blank">
            {trimAddress(account?.address, 10)}
          </a>
        </p>
      </div>
      <div className="txn-wrapper">
        <p>Transaction ID</p>
        <a href="https://voyager.online" target="_blank">
          {trimAddress(txId, 18)}
        </a>
      </div>
    </div>
  )
}

export default TransactionCard
