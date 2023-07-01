import React, { useContext, useEffect, useState } from 'react'
import { BigNumber, type BigNumberish } from 'ethers'

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
import {
  getParameterType,
  getReadFunctions,
  getWriteFunctions
} from '../../utils/utils'
import Container from '../../ui_components/Container'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import TransactionContext from '../../contexts/TransactionContext'
import { RemixClientContext } from '../../contexts/RemixClientContext'
import storage from '../../utils/storage'
import './index.css'
import { useAtom } from 'jotai'
import { EnhancedAbiElement, interactAtom } from '../../atoms'
import { BsHash } from 'react-icons/bs'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
type InteractionProps = {}

const Interaction: React.FC<InteractionProps> = () => {
  const { contracts, selectedContract } = useContext(CompiledContractsContext)
  const { account, provider } = useContext(ConnectionContext)

  const { transactions, setTransactions } = useContext(TransactionContext)
  const remixClient = useContext(RemixClientContext)

  const [contractsState, setContractsState] = useAtom(interactAtom)

  console.log(contractsState)

  const setReadState = (readState: EnhancedAbiElement[]) => {
    if (selectedContract)
      setContractsState({
        ...contractsState,
        [selectedContract?.address]: {
          ...contractsState[selectedContract?.address],
          readState: [...readState]
        }
      })
  }
  const setWriteState = (writeState: EnhancedAbiElement[]) => {
    if (selectedContract)
      setContractsState({
        ...contractsState,
        [selectedContract?.address]: {
          ...contractsState[selectedContract?.address],
          writeState: [...writeState]
        }
      })
  }

  const writeResponse = (
    response: CallContractResponse | GetTransactionReceiptResponse,
    funcName: string,
    stateType: 'read' | 'write',
    responseType: 'call' | 'invoke'
  ) => {
    if (selectedContract) {
      const currentContractObj = contractsState[selectedContract.address]
      switch (stateType) {
        case 'read':
          const readState = currentContractObj.readState
          const oldElem = readState.find((r_obj) => r_obj.name === funcName)
          const oldReadStateFunc = readState.filter(
            (r_obj) => r_obj.name !== funcName
          )
          if (oldElem) {
            if (responseType === 'call') {
              const newElem = {
                ...oldElem,
                callResponse: response as CallContractResponse
              }
              setContractsState({
                ...contractsState,
                [selectedContract?.address]: {
                  ...currentContractObj,
                  readState: [...oldReadStateFunc, newElem]
                }
              })
            } else if (responseType === 'invoke') {
              const newElem = {
                ...oldElem,
                invocationResponse: response as InvokeFunctionResponse
              }
              setContractsState({
                ...contractsState,
                [selectedContract?.address]: {
                  ...currentContractObj,
                  readState: [...oldReadStateFunc, newElem]
                }
              })
            }
          } /// If no old elem found, no need to udpate
          break
        case 'write':
          console.log('in write')
          const writeState = currentContractObj.writeState
          const oldElemW = writeState.find((r_obj) => r_obj.name === funcName)
          const oldWriteStateFunc = writeState.filter(
            (r_obj) => r_obj.name !== funcName
          )
          if (oldElemW) {
            if (responseType === 'call') {
              const newElem = {
                ...oldElemW,
                callResponse: response as CallContractResponse
              }
              setContractsState({
                ...contractsState,
                [selectedContract?.address]: {
                  ...currentContractObj,
                  writeState: [...oldWriteStateFunc, newElem]
                }
              })
            } else if (responseType === 'invoke') {
              const newElem = {
                ...oldElemW,
                invocationResponse: response as InvokeFunctionResponse
              }

              setContractsState({
                ...contractsState,
                [selectedContract?.address]: {
                  ...currentContractObj,
                  writeState: [...oldWriteStateFunc, newElem]
                }
              })
            }
          } /// If no old elem found, no need to udpate
          break
      }
    }
  }

  // const [readFunctions, setReadFunctions] = useState<AbiElement[]>([])
  // const [writeFunctions, setWriteFunctions] = useState<AbiElement[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [responses, setResponses] = useState<Response[]>([])
  const [notEnoughInputsMap, setNotEnoughInputsMap] = useState<
    Map<string, boolean>
  >(new Map())

  interface Response {
    contractName: string
    contractAddress: string
    functionName: string
    callResponse?: CallContractResponse
    invocationResponse?: GetTransactionReceiptResponse
  }

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
      console.log(readFunctions)

      writeFunctions = writeFunctions.map((func) => {
        func.calldata = new Array<CallDataObj>(func.inputs.length).fill([])
        return { ...func }
      })
      console.log(writeFunctions)

      // Merge with old objs, since old objs can have responses.
      const oldContractObj = contractsState[selectedContract.address]
      if (oldContractObj) {
        const oldReadObjs = oldContractObj.readState
        const oldWriteObj = oldContractObj.writeState
        const mergedReadFuncs = readFunctions.map((f) => {
          const old_found = oldReadObjs.find((o_f) => o_f.name === f.name)
          if (old_found) {
            return {
              ...f,
              ...old_found
            }
          } else {
            return f
          }
        })
        const mergedWriteFunc = writeFunctions.map((f) => {
          const old_found = oldWriteObj.find((o_f) => o_f.name === f.name)
          if (old_found) {
            return {
              ...f,
              ...old_found
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
    }
  }, [selectedContract])

  const getInvocation = (
    contractAddress: string,
    entrypoint: string,
    calldata: BigNumberish[] = []
  ): ((
    account: Account | AccountInterface
  ) => Promise<InvokeFunctionResponse>) => {
    const invocation = async (
      account: Account | AccountInterface
    ): Promise<InvokeFunctionResponse> => {
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
        value: {
          response,
          contract: selectedContract?.name,
          function: entrypoint
        },
        type: 'info'
      })
      const currNotifCount = storage.get('notifCount')
      if (currNotifCount !== undefined) {
        const notifCount = parseInt(currNotifCount)
        if (notifCount === 0)
          await remixClient.call(
            'notification' as any,
            'toast',
            'ℹ️ Responses are written to the terminal log'
          )
        storage.set('notifCount', (notifCount + 1) % 7)
      }
      return response
    }
    return invocation
  }

  const getCall = (
    contractAddress: string,
    entrypoint: string,
    calldata: BigNumberish[] = []
  ): ((
    account: Account | AccountInterface
  ) => Promise<CallContractResponse>) => {
    const call = async (
      account: Account | AccountInterface
    ): Promise<CallContractResponse> => {
      const response = await account.callContract({
        contractAddress,
        entrypoint,
        calldata: calldata as RawCalldata
      })
      await remixClient.call('terminal', 'log', {
        value: JSON.stringify(
          {
            response,
            contract: selectedContract?.name,
            function: entrypoint
          },
          null,
          2
        ),
        type: 'info'
      })
      const currNotifCount = storage.get('notifCount')
      if (currNotifCount !== undefined) {
        const notifCount = parseInt(currNotifCount)
        if (notifCount === 0)
          await remixClient.call(
            'notification' as any,
            'toast',
            'ℹ️ Responses are written to the terminal log'
          )
        storage.set('notifCount', (notifCount + 1) % 7)
      }
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
    if (!selectedContract) {
      console.error('No Contract Selected!!')
      return
    }
    if (type === 'view') {
      const readFunctions = contractsState[selectedContract?.address].readState
      const functionIndex = getFunctionIndex(name, readFunctions)
      const newReadFunctions = [...readFunctions]
      const calldata = newReadFunctions[functionIndex].calldata
      if (calldata !== undefined) {
        if (value.trim().length !== 0) {
          calldata[index] = value
            .trim()
            .split(',')
            .map((val: string) => val.trim())
        } else {
          calldata[index] = []
        }
      }
      // add valdiation on datatype
      newReadFunctions[functionIndex].calldata = calldata
      setReadState(newReadFunctions)
    }
    if (type === 'external') {
      const writeFunctions =
        contractsState[selectedContract?.address].writeState
      const functionIndex = getFunctionIndex(name, writeFunctions)
      const newWriteFunctions = [...writeFunctions]
      const calldata = newWriteFunctions[functionIndex].calldata
      if (calldata !== undefined) {
        if (value.trim().length !== 0) {
          calldata[index] = value
            .trim()
            .split(',')
            .map((val: string) => val.trim())
        } else {
          calldata[index] = []
        }
      }
      newWriteFunctions[functionIndex].calldata = calldata
      setWriteState(newWriteFunctions)
    }
  }

  const getFunctionIndex = (name: string, functions: AbiElement[]): number => {
    return functions.findIndex((func) => func.name === name)
  }

  const getFunctionFromName = (
    name: string,
    functions: AbiElement[]
  ): AbiElement | undefined => {
    return functions.find((func) => func.name === name)
  }

  const handleCall = async (e: any): Promise<void> => {
    e.preventDefault()
    if (!selectedContract) {
      console.error('No Contract Selected!!')
      return
    }
    const { name, type } = e.target.dataset
    if (type === 'view') {
      const readFunctions = contractsState[selectedContract?.address].readState
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
        selectedContract.address,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        func?.name!,
        (func?.calldata?.flat() as BigNumberish[]) ?? []
      )
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
      const response = await callFunction(account!)
      writeResponse(
        response,
        func?.name!,
        func?.state_mutability === 'view' ? 'read' : 'write',
        'call'
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
          callResponse: response
        }
      ])
    } else {
      const writeFunctions =
        contractsState[selectedContract?.address].writeState
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
      if ((func !== undefined && notEnoughInputsMap.get(func.name)) ?? false) {
        return
      }
      const invocation = getInvocation(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        selectedContract?.address!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        func?.name!,
        (func?.calldata?.flat() as BigNumberish[]) ?? []
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
      if (resultOfTx) {
        console.log('Writing Result of txn')
        writeResponse(resultOfTx, func?.name!, 'write', 'invoke')
      }
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
      {contracts.length > 0 && selectedContract != null ? (
        <CompiledContracts show="contract" />
      ) : (
        <div>
          <p>No compiled contracts to interact with... Yet.</p>
        </div>
      )}

      {selectedContract?.deployed ?? false ? (
        // eslint-disable-next-line multiline-ternary
        <>
          <div className="read-functions-wrapper">
            {selectedContract &&
              contractsState[selectedContract.address]?.readState?.map(
                (func, index) => {
                  return (
                    <>
                      <div
                        className="udapp_contractActionsContainerSingle function-label-wrapper"
                        style={{ display: 'flex' }}
                        key={index}
                      >
                        <button
                          className={`udapp_instanceButton undefined btn btn-sm btn-warning ${
                            func.inputs.length === 0 ? 'w-100' : 'w-50'
                          }`}
                          data-name={func.name}
                          data-type={func.state_mutability}
                          // eslint-disable-next-line @typescript-eslint/no-misused-promises
                          onClick={handleCall}
                        >
                          {func.name}
                        </button>
                        <div
                          className={`function-inputs ${
                            func.inputs.length === 0 ? 'w-0' : 'w-50'
                          }`}
                        >
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
                                  placeholder={`${
                                    input.name
                                  } (${getParameterType(input.type)})`}
                                  onChange={handleCalldataChange}
                                  key={index}
                                />
                              )
                            })}
                        </div>
                        <label>
                          {(notEnoughInputsMap.get(func.name) ?? false) &&
                            'Not enough inputs provided'}
                        </label>
                      </div>
                      <div className="w-100">
                        {func?.outputs && func.outputs?.map(o => o.type).join(',')}
                        {func.callResponse?.result && (
                          <p>{JSON.stringify(func.callResponse.result)}</p>
                        )}
                      </div>
                    </>
                  )
                }
              )}
          </div>
          {selectedContract &&
            contractsState[selectedContract.address]?.writeState?.map(
              (func, index) => {
                return (
                  <>
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
                                placeholder={`${input.name} (${getParameterType(
                                  input.type
                                )})`}
                                // value={constructorCalldata[index]?.value || ""}
                                onChange={handleCalldataChange}
                                key={index}
                              />
                            )
                          })}
                      </div>
                    </div>
                    <div className="response-wrapper w-100">
                      <p>Last Response</p>
                      {func?.invocationResponse?.transaction_hash && (
                        <span className="d-flex">
                          {' '}
                          <BsHash size={24} />
                          <p title={func?.invocationResponse?.transaction_hash}>
                            {' '}
                            {func?.invocationResponse?.transaction_hash}
                          </p>
                        </span>
                      )}
                      {func?.invocationResponse?.actual_fee && (
                        <p>
                          Fee:{' '}
                          {BigNumber.from(
                            func?.invocationResponse?.actual_fee
                          ).toString()}{' '}
                          WEI
                        </p>
                      )}
                      {(func?.invocationResponse as any)
                        ?.execution_resources && (
                        <p>
                          {JSON.stringify(
                            (func?.invocationResponse as any)
                              ?.execution_resources['n_steps']
                          )}{' '}
                          Steps
                        </p>
                      )}
                    </div>
                  </>
                )
              }
            )}
        </>
      ) : (
        <p> Selected contract is not deployed yet... </p>
      )}
    </Container>
  )
}

export default Interaction
