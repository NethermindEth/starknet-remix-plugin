import React, { useContext, useEffect, useState } from 'react'
import Container from '../../ui_components/Container'
import TransactionContext from '../../contexts/TransactionContext'
import TransactionCard from './TransactionCard'
import { type constants } from 'starknet'
import { networkEquivalentsRev } from '../../utils/constants'

const TransactionHistory: React.FC = () => {
  const { transactions } = useContext(TransactionContext)
  const [txChainIds, setTxChainIds] = useState<
    Map<string, constants.StarknetChainId>
  >(new Map())

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      const newTxChainIds = new Map<string, constants.StarknetChainId>()
      for (const tx of transactions) {
        if (tx.provider == null) continue
        const chainId = await tx.provider.getChainId()
        newTxChainIds.set(tx.txId, chainId)
      }
      setTxChainIds(newTxChainIds)
    })
  })

  const getChain = (txId: string | undefined): string => {
    if (txId == null) return 'unknown'
    const chainId = txChainIds.get(txId)
    if (chainId == null) return 'unknown'
    return networkEquivalentsRev.get(chainId) ?? 'unknown'
  }

  return (
    <Container>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {transactions.length === 0 ? (
          <div>No transactions yet</div>
        ) : (
          transactions.map((transaction, index) => {
            return <TransactionCard key={transaction.txId} {...transaction} />
          })
        )}
      </div>
    </Container>
  )
}

export default TransactionHistory
