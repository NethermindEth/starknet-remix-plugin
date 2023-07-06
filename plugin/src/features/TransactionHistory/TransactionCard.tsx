import React, { useEffect, useMemo, useRef } from 'react'
import { Transaction } from '../../types/transaction'
import './transactioncard.css'

type TagType = {
  type: 'deploy' | 'declare' | 'invoke' | 'deployAccount'
}

const Tag: React.FC<TagType> = ({ type }) => {
  return <span className={`p-2 tag tag-${type}`}>{type}</span>
}

type NetworkTypeTag = {
  type: string
}

const NetworkTag:React.FC<NetworkTypeTag> = ({ type }) => {
  return <span className={`p-2 tag tag-${type}`}>{type}</span>
}

// const trimAddress = (str?: string, strip?: number) => {
//   if (!str) {
//     return ''
//   }
//   const length = str.length
//   return `${str?.slice(0, strip || 6)}...${str?.slice(length - (strip || 6))}`
// }

const TransactionCard: React.FC<Transaction> = ({ account, txId, type, env }) => {
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
        <p>From: </p>
        <a
          title={account?.address}
          href="https://voyager.online"
          target="_blank"
        >
          {account?.address}
        </a>
      </div>
      <div className="txn-wrapper">
        <p>Transaction ID</p>
        <a href="https://voyager.online" target="_blank" title={txId}>
          {txId}
        </a>
      </div>
      <div className="txn-network">
        <p>Network</p>
        <NetworkTag type={env} />
      </div>
    </div>
  )
}

export default TransactionCard
