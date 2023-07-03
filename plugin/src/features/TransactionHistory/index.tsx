import React, { useContext, useEffect, useState } from 'react'
import Container from '../../ui_components/Container'
import TransactionContext from '../../contexts/TransactionContext'
import { type constants } from 'starknet'

const TransactionHistory: React.FC = () => {
  const { transactions } = useContext(TransactionContext)
  const [txChainIds, setTxChainIds] = useState<Map<string, constants.StarknetChainId>>(new Map())

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
              <div>chainId : {txChainIds.get(transaction.txId)} </div>
            </div>
          )
        })
      }
    </Container>
  )
}

export default TransactionHistory
