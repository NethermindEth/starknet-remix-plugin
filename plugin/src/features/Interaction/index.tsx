import React, { useContext, useEffect, useState } from 'react'
import { type BigNumberish } from 'ethers'

import {
  type Account,
  type RawCalldata,
  type CallContractResponse,
  type GetTransactionReceiptResponse,
  type AccountInterface,
  type InvokeFunctionResponse
} from 'starknet'
import CompiledContracts from '../../components/CompiledContracts'
import { CompiledContractsContext } from '../../contexts/CompiledContractsContext'
import { type CallDataObj, type AbiElement } from '../../types/contracts'
import { getParameterType, getReadFunctions, getWriteFunctions } from '../../utils/utils'
import Container from '../../ui_components/Container'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import TransactionContext from '../../contexts/TransactionContext'
import { RemixClientContext } from '../../contexts/RemixClientContext'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface InteractionProps {}

const Interaction: React.FC<InteractionProps> = () => {
  const [readFunctions, setReadFunctions] = useState<AbiElement[]>([])
  const [writeFunctions, setWriteFunctions] = useState<AbiElement[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [notEnoughInputsMap, setNotEnoughInputsMap] = useState<Map<string, boolean>>(new Map())

  const { contracts, selectedContract } = useContext(CompiledContractsContext)
  const { account, provider } = useContext(ConnectionContext)

  const { transactions, setTransactions } = useContext(TransactionContext)
  const remixClient = useContext(RemixClientContext)

  interface Response {
    contractName: string
    contractAddress: string
    functionName: string
    callResponse?: CallContractResponse
    invocationResponse?: GetTransactionReceiptResponse
  }

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

      readFunctions.forEach((func) => {
        setNotEnoughInputsMap((prev) => {
          const newMap = new Map(prev)
          newMap.set(func.name, false)
          return newMap
        })
      })

      writeFunctions.forEach((func) => {
        setNotEnoughInputsMap((prev) => {
          const newMap = new Map(prev)
          newMap.set(func.name, false)
          return newMap
        })
      })

      setReadFunctions(readFunctions)
      setWriteFunctions(writeFunctions)
    }
  }, [selectedContract])

  const getInvocation = (
    contractAddress: string,
    entrypoint: string,
    calldata: BigNumberish[] = []
  ): (account: Account | AccountInterface) => Promise<InvokeFunctionResponse> => {
    const invocation = async (account: Account | AccountInterface): Promise<InvokeFunctionResponse> => {
      const response = await account.execute({
        contractAddress,
        entrypoint,
        calldata: calldata as RawCalldata
      })
      setTransactions([
        ...transactions,
        {
          type: 'invoke',
          account,
          provider,
          txId: response.transaction_hash
        }
      ])
      await remixClient.call('terminal', 'log', {
        value: response,
        type: 'info'
      })
      return response
    }
    return invocation
  }

  const getCall = (
    contractAddress: string,
    entrypoint: string,
    calldata: BigNumberish[] = []
  ): (account: Account | AccountInterface) => Promise<CallContractResponse> => {
    const call = async (account: Account | AccountInterface): Promise<CallContractResponse> => {
      const response = await account.callContract({
        contractAddress,
        entrypoint,
        calldata: calldata as RawCalldata
      })
      await remixClient.call('terminal', 'log', {
        value: response,
        type: 'info'
      })
      return response
    }
    return call
  }

  // Handle calldata change
  const handleCalldataChange = (e: any): void => {
    const { name, value, dataset } = e.target
    const { type, index } = dataset
    // set not enough inputs to false
    setNotEnoughInputsMap((prev) => {
      const newMap = new Map(prev)
      newMap.set(name, false)
      return newMap
    })
    if (type === 'view') {
      const functionIndex = getFunctionIndex(name, readFunctions)
      const newReadFunctions = [...readFunctions]
      const calldata = newReadFunctions[functionIndex].calldata
      if (calldata !== undefined) {
        if (value.trim().length !== 0) {
          calldata[index] = value.trim().split(',').map((val: string) => val.trim())
        } else {
          calldata[index] = []
        }
      }
      // add valdiation on datatype
      newReadFunctions[functionIndex].calldata = calldata
      setReadFunctions(newReadFunctions)
    }
    if (type === 'external') {
      const functionIndex = getFunctionIndex(name, writeFunctions)
      const newWriteFunctions = [...writeFunctions]
      const calldata = newWriteFunctions[functionIndex].calldata
      if (calldata !== undefined) {
        if (value.trim().length !== 0) {
          calldata[index] = value.trim().split(',').map((val: string) => val.trim())
        } else {
          calldata[index] = []
        }
      }
      newWriteFunctions[functionIndex].calldata = calldata
      setWriteFunctions(newWriteFunctions)
    }
  }

  const getFunctionIndex = (name: string, functions: AbiElement[]): number => {
    return functions.findIndex((func) => func.name === name)
  }

  const getFunctionFromName = (name: string, functions: AbiElement[]): AbiElement | undefined => {
    return functions.find((func) => func.name === name)
  }

  const handleCall = async (e: any): Promise<void> => {
    e.preventDefault()
    const { name, type } = e.target.dataset
    if (type === 'view') {
      const func = getFunctionFromName(name, readFunctions)
      const newMap = new Map(notEnoughInputsMap)
      func?.calldata?.forEach((calldata) => {
        if (calldata.length === 0) {
          newMap.set(func.name, true)
        }
      })
      setNotEnoughInputsMap(newMap)
      // if any value is true then return
      if (Array.from(newMap.values()).includes(true)) {
        return
      }
      const callFunction = getCall(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        selectedContract?.address!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        func?.name!,
        func?.calldata?.flat() as BigNumberish[] ?? []
      )
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
      const response = await callFunction(account!)
      setResponses((responses) => [
        ...responses,
        {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
          functionName: func?.name!,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
          contractName: selectedContract?.name!,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
          contractAddress: selectedContract?.address!,
          callResponse: response
        }
      ])
    } else {
      const func = getFunctionFromName(name, writeFunctions)
      func?.calldata?.forEach((calldata) => {
        if (calldata.length === 0) {
          setNotEnoughInputsMap((prev) => {
            const newMap = new Map(prev)
            newMap.set(func.name, true)
            return newMap
          })
        }
      })
      if (((func !== undefined) && notEnoughInputsMap.get(func.name)) ?? false) {
        return
      }
      const invocation = getInvocation(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        selectedContract?.address!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        func?.name!,
        func?.calldata?.flat() as BigNumberish[] ?? []
      )
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
      const response = await invocation(account!)
      console.log(response)
      console.log(
        'Transaction:',
        await account?.getTransaction(response.transaction_hash)
      )
      const resultOfTx = await provider?.waitForTransaction(
        response.transaction_hash
      )
      setResponses((responses) => [
        ...responses,
        {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
          functionName: func?.name!,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
          contractName: selectedContract?.name!,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
          contractAddress: selectedContract?.address!,
          invocationResponse: resultOfTx
        }
      ])
    }
  }

  return (
    <Container>
      {contracts.length > 0 && selectedContract != null
        ? (
        <CompiledContracts />
          )
        : (
        <div>
          <p>No compiled contracts to interact with... Yet.</p>
        </div>
          )}
      { ((selectedContract?.deployed) ?? false)
        // eslint-disable-next-line multiline-ternary
        ? <>
      {readFunctions.map((func, index) => {
        return (
          <div
            className="udapp_contractActionsContainerSingle pt-2 function-label-wrapper"
            style={{ display: 'flex' }}
            key={index}
          >
            <button
              className="udapp_instanceButton undefined btn btn-sm btn-warning w-50"
              data-name={func.name}
              data-type={func.state_mutability}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handleCall}
            >
              {func.name}
            </button>
            <div className="function-inputs w-50">
              {func.inputs.length > 0 &&
                func.inputs.map((input, index) => {
                  return (
                    <input
                      className="form-control function-input"
                      name={func.name}
                      data-type={func.state_mutability}
                      data-index={index}
                      data-datatype={input.type}
                      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                      placeholder={`${input.name} (${getParameterType(input.type)})`}
                      onChange={handleCalldataChange}
                      key={index}
                    />
                  )
                })}
            </div>
            <label>{(notEnoughInputsMap.get(func.name) ?? false) && 'Not enough inputs provided'}</label>
          </div>
        )
      })}
      {writeFunctions.map((func, index) => {
        return (
          <div
            className="udapp_contractActionsContainerSingle pt-2 function-label-wrapper"
            style={{ display: 'flex' }}
            key={index}
          >
            <button
              className="udapp_instanceButton undefined btn btn-sm btn-info w-50"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handleCall}
              data-name={func.name}
              data-type={func.state_mutability}
            >
              {func.name}
            </button>
            <div className="function-inputs w-50">
              {func.inputs.length > 0 &&
                func.inputs.map((input, index) => {
                  return (
                    <input
                      className="form-control function-input"
                      name={func.name}
                      data-type={func.state_mutability}
                      data-index={index}
                      data-datatype={input.type}
                      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                      placeholder={`${input.name} (${getParameterType(input.type)})`}
                      // value={constructorCalldata[index]?.value || ""}
                      onChange={handleCalldataChange}
                      key={index}
                    />
                  )
                })}
            </div>
          </div>
        )
      })}
      </> : <p> Selected contract is not deployed yet... </p>}
      {responses.length > 0 && (
        <div className="my-5">
          <p>Responses:</p>
          {responses.reverse().map((response, index) => {
            return (
              <div key={index} className="mb-4">
                <p className="mb-0">
                  Function: <i>{response.functionName}</i>
                </p>
                <p className="mb-0">
                  Contract: <i>{response.contractName}</i> at{' '}
                  <i>{response.contractAddress}</i>
                </p>
                {response.callResponse != null && (
                  <p className="mb-0">
                    Result:{' '}
                    <pre>{JSON.stringify(response.callResponse, null, 2)}</pre>
                  </p>
                )}
                {response.invocationResponse != null && (
                  <p className="mb-0">
                    Response:{' '}
                    <pre>
                      {JSON.stringify(response.invocationResponse, null, 2)}
                    </pre>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}

export default Interaction
