import React, { useEffect, useMemo, useRef } from 'react'
import { type Transaction } from '../../types/transaction'
import './transactioncard.css'
import { networkEquivalentsRev } from '../../utils/constants'

interface TagType {
  type: 'deploy' | 'declare' | 'invoke' | 'deployAccount'
}

const Tag: React.FC<TagType> = ({ type }) => {
  return <span className={`p-2 tag tag-${type}`}>{type}</span>
}

interface NetworkTypeTag {
  type: string
}

const transformTypeToText = (type: string) => {
  switch (type) {
    case 'localDevnet':
      return 'Local Devnet'
    case 'remoteDevnet':
      return 'Remote Devnet'
    default:
      return type
  }
}

const NetworkTag: React.FC<NetworkTypeTag> = ({ type }) => {
  return (
    <span className={`p-2 tag tag-${type}`}>{transformTypeToText(type)}</span>
  )
}

const TransactionCard: React.FC<Transaction> = ({
  account,
  txId,
  type,
  env,
  provider
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const width = useMemo(() => {
    return (cardRef.current != null) ? cardRef.current.offsetWidth : 0
  }, [cardRef.current])
  const [chain, setChain] = React.useState<string>('goerli-alpha')

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      if (provider == null) return
      const chainId = await provider.getChainId()
      setChain(networkEquivalentsRev.get(chainId) ?? 'unknown')
    })
  })

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
          target="_blank" rel="noreferrer"
        >
          {account?.address}
        </a>
      </div>
      <div className="txn-wrapper">
        <p>Transaction ID</p>
        <a href="https://voyager.online" target="_blank" title={txId} rel="noreferrer">
          {txId}
        </a>
      </div>
      <div className="txn-network">
        { (env === 'localDevnet' || env === 'remoteDevnet') ? <p>Network</p> : <p>Chain</p> }
        <NetworkTag type={(env === 'localDevnet' || env === 'remoteDevnet') ? env : chain} />
      </div>
    </div>
  )
}

export default TransactionCard
