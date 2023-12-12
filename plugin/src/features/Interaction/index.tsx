/* eslint-disable multiline-ternary */
import React, { useEffect, useState } from 'react'

import { constants } from 'starknet'
import CompiledContracts from '../../components/CompiledContracts'
import { type CallDataObj } from '../../utils/types/contracts'
import { getReadFunctions, getWriteFunctions } from '../../utils/utils'
import Container from '../../components/ui_components/Container'
import storage from '../../utils/storage'
import './index.css'
import './override.css'
import { useAtom, useAtomValue } from 'jotai'
import { interactAtom, type UiAbiState } from '../../atoms'

import transactionsAtom from '../../atoms/transactions'
import {
  compiledContractsAtom,
  selectedCompiledContract
} from '../../atoms/compiledContracts'
import { envAtom } from '../../atoms/environment'
import useAccount from '../../hooks/useAccount'
import useProvider from '../../hooks/useProvider'
import useRemixClient from '../../hooks/useRemixClient'

import { ABIForm, type CallbackReturnType } from 'starknet-abi-forms'
import 'starknet-abi-forms/index.css'

interface InteractionProps {
  setInteractionStatus: React.Dispatch<
  React.SetStateAction<'loading' | 'error' | 'success' | ''>
  >
}

const Interaction: React.FC<InteractionProps> = (props) => {
  const contracts = useAtomValue(compiledContractsAtom)
  const selectedContract = useAtomValue(selectedCompiledContract)

  const { account } = useAccount()
  const { provider } = useProvider()

  const [transactions, setTransactions] = useAtom(transactionsAtom)

  const { remixClient } = useRemixClient()
  const env = useAtomValue(envAtom)

  const [contractsState, setContractsState] = useAtom(interactAtom)

  const [chainId, setChainId] = useState<constants.StarknetChainId>(
    constants.StarknetChainId.SN_GOERLI
  )

  useEffect(() => {
    if (provider !== null) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setTimeout(async () => {
        try {
          const chainId = await provider.getChainId()
          setChainId(chainId)
        } catch (error) {
          console.log(error)
        }
      }, 1)
    }
  }, [provider])

  useEffect(() => {
    const currNotifCount = storage.get('notifCount')
    if (currNotifCount === null || currNotifCount === undefined) {
      storage.set('notifCount', 0 as number)
    }
  })

  useEffect(() => {
    if (selectedContract != null) {
      let readFunctions = getReadFunctions(selectedContract?.abi)
      let writeFunctions = getWriteFunctions(selectedContract?.abi)

      readFunctions = readFunctions.map((func) => {
        func.calldata = new Array<CallDataObj>(func.inputs.length).fill([])
        return { ...func }
      })

      writeFunctions = writeFunctions.map((func) => {
        func.calldata = new Array<CallDataObj>(func.inputs.length).fill([])
        return { ...func }
      })

      // Merge with old objs, since old objs can have responses.
      const oldContractObj: undefined | UiAbiState =
        contractsState[selectedContract.address]
      if (oldContractObj !== undefined) {
        const oldReadObjs = oldContractObj.readState
        const oldWriteObj = oldContractObj.writeState
        const mergedReadFuncs = readFunctions.map((f) => {
          const oldFound = oldReadObjs.find((oF) => oF.name === f.name)
          if (oldFound != null) {
            return {
              ...f,
              ...oldFound
            }
          } else {
            return f
          }
        })
        const mergedWriteFunc = writeFunctions.map((f) => {
          const oldFound = oldWriteObj.find((oF) => oF.name === f.name)
          if (oldFound != null) {
            return {
              ...f,
              ...oldFound
            }
          } else {
            return f
          }
        })
        setContractsState({
          ...contractsState,
          [selectedContract.address]: {
            ...contractsState[selectedContract.address],
            readState: [...mergedReadFuncs],
            writeState: [...mergedWriteFunc]
          }
        })
      } else {
        setContractsState({
          ...contractsState,
          [selectedContract.address]: {
            ...contractsState[selectedContract.address],
            readState: [...readFunctions],
            writeState: [...writeFunctions]
          }
        })
      }
    }
  }, [selectedContract])

  const isContractSelected =
    contracts.length > 0 &&
    selectedContract != null &&
    selectedContract !== undefined

  // boolean check if the selected contract is deployed on the
  // current chain using the current account
  const isAccountAndContractValid =
    isContractSelected &&
    account != null &&
    selectedContract.deployedInfo.some(
      (info) => info.address === account.address && info.chainId === chainId
    )

  const handleCallBack = async (res: CallbackReturnType): Promise<void> => {
    // Set remix icon status to loading while interacting with the contract
    remixClient.emit('statusChanged', {
      key: 'loading',
      type: 'info',
      title: `Calling ${res.functionName}...`
    })
    props.setInteractionStatus('loading')

    try {
      // Return if no contract is selected
      if (selectedContract === null) {
        throw new Error('No Contract Selected!')
      }

      // Return if no account is selected
      if (account === null || account === undefined) {
        throw new Error('No account selected.')
      }

      /**
       * If the function is a view function, call the contract
       * the result of the called function is written to the terminal log
       * Steps needed to be taken care of :
       *  - update the icon to loading during the call
       *  - update the icon to success if the call succeeds
       *  - logs the result of the call to the terminal log
       *  - show the notif to user every 7th time the call is made
       */
      if (res.stateMutability === 'view') {
        await remixClient.call('terminal', 'log', {
          value: `------------------- Calling ${res.functionName} ------------------------`,
          type: 'info'
        })

        // calling the contract
        const resp = await account.callContract({
          contractAddress: selectedContract.address,
          entrypoint: res.functionName,
          calldata: res.starknetjs
        })
        // updating the icon to success
        remixClient.emit('statusChanged', {
          key: 'succeed',
          type: 'success',
          title:
            'Function call succeeded, results are written to the terminal log'
        })
        // writing the result of the call to the terminal log
        await remixClient.call('terminal', 'log', {
          value: JSON.stringify(
            {
              resp,
              contract: selectedContract?.name,
              function: res.functionName
            },
            null,
            2
          ),
          type: 'info'
        })
        // showing the notif to user every 7th time the call is made
        const currNotifCount = storage.get('notifCount')
        if (currNotifCount !== undefined) {
          const notifCount = parseInt(currNotifCount)
          if (notifCount === 0) {
            await remixClient.call(
              'notification' as any,
              'toast',
              'ℹ️ Responses are written to the terminal log'
            )
          }
          storage.set('notifCount', (notifCount + 1) % 7)
        }
        await remixClient.call('terminal', 'log', {
          value: `------------------- End calling ${res.functionName} --------------------`,
          type: 'info'
        })
      }

      /**
       * If the function is an external function, invoke the contract
       * the result of the invoked function is written to the terminal log
       * Steps needed to be taken care of :
       * - update the icon to loading during the call
       * - update the icon to success if the call succeeds
       * - Log the transaction receipt to the terminal log
       * - Add the transaction to the transactions list
       * - wait for the transaction to be accepted
       * - log the result of the transaction to the terminal log
       * - show the notif to user every 7th time the call is made
       */
      if (res.stateMutability === 'external') {
        await remixClient.call('terminal', 'log', {
          value: `------------------ Invoking ${res.functionName} -----------------------`,
          type: 'info'
        })
        const resp = await account.execute({
          contractAddress: selectedContract.address,
          entrypoint: res.functionName,
          calldata: res.starknetjs
        })
        remixClient.emit('statusChanged', {
          key: 'succeed',
          type: 'success',
          title: 'Transaction sent with Hash: ' + resp.transaction_hash
        })
        setTransactions([
          {
            type: 'invoke',
            account,
            provider,
            txId: resp.transaction_hash,
            env
          },
          ...transactions
        ])

        await remixClient.call('terminal', 'log', {
          value: `---------- Invoke ${res.functionName} transaction receipt ----------------`,
          type: 'info'
        })

        await remixClient.call('terminal', 'log', {
          value: JSON.stringify({
            resp,
            contract: selectedContract?.name,
            function: res.functionName
          }, null, 2),
          type: 'info'
        })
        const currNotifCount = storage.get('notifCount')
        if (currNotifCount !== undefined) {
          const notifCount = parseInt(currNotifCount)
          if (notifCount === 0) {
            await remixClient.call(
              'notification' as any,
              'toast',
              'ℹ️ Responses are written to the terminal log'
            )
          }
          storage.set('notifCount', (notifCount + 1) % 7)
        }

        await remixClient.call('terminal', 'log', {
          value: `----- Getting invoke ${res.functionName} transaction details ... ----------`,
          type: 'info'
        })

        const resultOfTx = await provider?.waitForTransaction(
          resp.transaction_hash
        )

        await remixClient.call('terminal', 'log', {
          value: `---------- Invoke ${res.functionName} transaction details ----------------`,
          type: 'info'
        })

        await remixClient.call('terminal', 'log', {
          value: JSON.stringify({
            resultOfTx,
            contract: selectedContract?.name,
            function: res.functionName
          }, null, 2),
          type: 'info'
        })
        await remixClient.call('terminal', 'log', {
          value: `------------------ End Invoking ${res.functionName} -------------------`,
          type: 'info'
        })
      }
      props.setInteractionStatus('success')
    } catch (error) {
      props.setInteractionStatus('error')
      if (error instanceof Error) {
        await remixClient.call('terminal', 'log', {
          value: error.message,
          type: 'error'
        })
      }
      remixClient.emit('statusChanged', {
        key: 'failed',
        type: 'error',
        title: 'Interaction responses have been written to the terminal log'
      })
    }
  }

  return (
    <Container>
      {contracts.length > 0 && selectedContract != null ? (
        <CompiledContracts show="contract" />
      ) : (
        <div>
          <p>No compiled contracts to interact with... Yet.</p>
        </div>
      )}

      {isContractSelected && isAccountAndContractValid ? (
        <ABIForm
          key={selectedContract?.compiledClassHash + selectedContract?.address}
          abi={selectedContract?.abi}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          callBackFn={handleCallBack}
        />
      ) : (
        <p> Selected contract is not deployed yet... </p>
      )}
    </Container>
  )
}

export default Interaction
