import React, { useEffect, useMemo, useRef } from 'react'
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
  const cardRef = useRef<HTMLDivElement>(null)
  const width = useMemo(() => {
    return cardRef.current ? cardRef.current.offsetWidth : 0
  }, [cardRef.current])
  return (
    <div className="maincard" ref={cardRef}>
      <div className="tag-wrapper">
        <Tag type={type} />
      </div>
      <div className="account-wrapper">
        <p title={account?.address}>
          From:{' '}
          <a href="https://voyager.online" target="_blank">
            {trimAddress(account?.address, width < 250 ? 3 : 10)}
          </a>
        </p>
      </div>
      <div className="txn-wrapper">
        <p>Transaction ID</p>
        <a href="https://voyager.online" target="_blank">
          {trimAddress(txId, width < 250 ? 10 : 16)}
        </a>
      </div>
    </div>
  )
}

export default TransactionCard
