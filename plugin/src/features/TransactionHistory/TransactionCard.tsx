import React, { useEffect, useRef } from 'react'
import { type Transaction } from '../../utils/types/transaction'
import './transactioncard.css'
import { type Network, networkEquivalentsRev, type networkExplorerUrls } from '../../utils/constants'
import { getExplorerUrl } from '../../utils/utils'

interface TagType {
  type: 'deploy' | 'declare' | 'invoke' | 'deployAccount'
}

const Tag: React.FC<TagType> = ({ type }) => {
  return <span className={`p-2 tag tag-${type}`}>{type === 'deployAccount' ? 'deploy account' : type}</span>
}

interface NetworkTypeTag {
  type: string
}

const transformTypeToText = (type: string): string => {
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

interface TransactionCardProps {
  transaction: Transaction
  explorer: keyof typeof networkExplorerUrls
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction, explorer
}) => {
  const { account, txId, env } = transaction

  const cardRef = useRef<HTMLDivElement>(null)
  const [chain, setChain] = React.useState<string>('goerli-alpha')

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      if (transaction.provider == null) return
      const chainId = await transaction.provider.getChainId()
      setChain(networkEquivalentsRev.get(chainId) ?? 'unknown')
    })
  })

  return (
    <div className="maincard" ref={cardRef}>
      <div className="tag-wrapper">
        <Tag type={transaction.type} />
      </div>
      <div className="account-wrapper">
        <p>From: </p>
         { (env === 'localDevnet' || env === 'remoteDevnet')
           ? <a
          title={account?.address}
          target="_blank" rel="noreferrer"
        >
          {account?.address}
        </a>
           : <a
          title={account?.address}
          href={`${getExplorerUrl(explorer, chain as Network)}/contract/${account?.address ?? ''}`}
          target="_blank" rel="noreferrer"
        >
          {account?.address}
        </a> }
      </div>
      <div className="txn-wrapper">
        <p>Transaction ID</p>
        { (env === 'localDevnet' || env === 'remoteDevnet')
          ? <a target="_blank" title={txId} rel="noreferrer">
          {txId}
        </a>
          : <a href={`${getExplorerUrl(explorer, chain as Network)}/tx/${txId}`} target="_blank" title={txId} rel="noreferrer">
        {txId}
      </a>}
      </div>
      <div className="txn-network">
        { (env === 'localDevnet' || env === 'remoteDevnet') ? <p>Network</p> : <p>Chain</p> }
        <NetworkTag type={(env === 'localDevnet' || env === 'remoteDevnet') ? env : chain} />
      </div>
    </div>
  )
}

export default TransactionCard
