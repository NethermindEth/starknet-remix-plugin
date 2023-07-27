/* eslint-disable react/jsx-key */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-case-declarations */
/* eslint-disable multiline-ternary */
import React, { useContext, useEffect, useState } from 'react'
import { type BigNumberish } from 'ethers'

import {
  type Account,
  type RawCalldata,
  type CallContractResponse,
  type GetTransactionReceiptResponse,
  type AccountInterface,
  type InvokeFunctionResponse,
  constants
} from 'starknet'
import CompiledContracts from '../../components/CompiledContracts'
import { CompiledContractsContext } from '../../contexts/CompiledContractsContext'
import { type CallDataObj, type Input } from '../../types/contracts'
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
import { type EnhancedAbiElement, interactAtom } from '../../atoms'
import { Formik } from 'formik'
import Yup, { transformInputs } from '../../utils/yup'

import { BiReset } from 'react-icons/bi'
import EnvironmentContext from '../../contexts/EnvironmentContext'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface InteractionProps {
  setInteractionStatus: React.Dispatch<React.SetStateAction<'loading' | 'error' | 'success' | ''>>
}

const Interaction: React.FC<InteractionProps> = (props) => {
  const { contracts, selectedContract } = useContext(CompiledContractsContext)
  const { account, provider } = useContext(ConnectionContext)

  const { transactions, setTransactions } = useContext(TransactionContext)
  const remixClient = useContext(RemixClientContext)
  const { env } = useContext(EnvironmentContext)

  const [contractsState, setContractsState] = useAtom(interactAtom)

  // console.log(contractsState[selectedContract?.address!])

  const setReadState = (readState: EnhancedAbiElement[]) => {
    if (selectedContract != null) {
      setContractsState({
        ...contractsState,
        [selectedContract?.address]: {
          ...contractsState[selectedContract?.address],
          readState: [...readState]
        }
      })
    }
  }
  const setWriteState = (writeState: EnhancedAbiElement[]) => {
    if (selectedContract != null) {
      setContractsState({
        ...contractsState,
        [selectedContract?.address]: {
          ...contractsState[selectedContract?.address],
          writeState: [...writeState]
        }
      })
    }
  }

  const writeResponse = (
    response: CallContractResponse | GetTransactionReceiptResponse,
    funcName: string,
    stateType: 'external' | 'view'
  ) => {
    if (selectedContract != null) {
      const currentContractObj = contractsState[selectedContract.address]
      switch (stateType) {
        case 'view':
          const readState = currentContractObj.readState
          const oldElemIdx = readState.findIndex(
            (rObj) => rObj.name === funcName
          )
          if (oldElemIdx !== -1) {
            const oldElem = readState[oldElemIdx]
            const newElem = {
              ...oldElem,
              callResponse: response as CallContractResponse
            }
            const newReadState = readState.map((rObj) => {
              if (rObj.name === funcName) {
                return newElem
              }
              return rObj
            })
            setContractsState({
              ...contractsState,
              [selectedContract?.address]: {
                ...currentContractObj,
                readState: newReadState
              }
            })
            /// If no old elem found, no need to udpate
          }
          break
        case 'external':
          const writeState = currentContractObj.writeState
          const oldElemWIdx = writeState.findIndex(
            (rObj) => rObj.name === funcName
          )
          if (oldElemWIdx !== -1) {
            const oldElemW = writeState[oldElemWIdx]
            const newElemW = {
              ...oldElemW,
              invocationResponse: response as InvokeFunctionResponse
            }
            const newWriteStateFunc = writeState.map((rObj) => {
              if (rObj.name === funcName) {
                return newElemW
              }
              return rObj
            })

            setContractsState({
              ...contractsState,
              [selectedContract?.address]: {
                ...currentContractObj,
                writeState: newWriteStateFunc
              }
            })
          }
          /// If no old elem found, no need to udpate
          break
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setResponses] = useState<Response[]>([])

  interface Response {
    contractName: string
    contractAddress: string
    functionName: string
    callResponse?: CallContractResponse
    invocationResponse?: GetTransactionReceiptResponse
  }

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
      const oldContractObj = contractsState[selectedContract.address]
      if (oldContractObj) {
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
        {
          type: 'invoke',
          account,
          provider,
          txId: response.transaction_hash,
          env
        },
        ...transactions
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
        if (notifCount === 0) {
          await remixClient.call(
            'notification' as any,
            'toast',
            'ℹ️ Responses are written to the terminal log'
          )
        }
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
        if (notifCount === 0) {
          await remixClient.call(
            'notification' as any,
            'toast',
            'ℹ️ Responses are written to the terminal log'
          )
        }
        storage.set('notifCount', (notifCount + 1) % 7)
      }
      return response
    }
    return call
  }

  const makeCallDatafromInput = (
    input: Input[],
    finalInputForm: any
  ): CallDataObj[] => {
    const inputs: CallDataObj[] = []
    try {
      input.forEach((c) => {
        if (c.name) {
          if (finalInputForm[c.name]) {
            const callDataB = transformInputs(finalInputForm[c.name])
            if (!Array.isArray(callDataB)) {
              inputs.push([callDataB.toHexString()])
            } else {
              inputs.push(callDataB.map((c) => c.toHexString()))
            }
          }
        }
      })
    } catch (e) {
      console.error(e)
      alert('Fatal Error in converting to calldata!!')
    }

    return inputs
  }

  const clearRawInputs = async (
    type: 'view' | 'external',
    funcName: string
  ) => {
    if (selectedContract == null) {
      console.error('No Contract Selected!!')
      return
    }
    switch (type) {
      case 'view':
        const readFunctions =
          contractsState[selectedContract?.address].readState
        const newReadFns = readFunctions.map((rf) => {
          if (rf.name === funcName) {
            return {
              ...rf,
              inputs: rf.inputs.map((prev) => {
                const { rawInput, ...rest } = prev
                return rest
              })
            }
          }
          return rf
        })
        setReadState(newReadFns)
        break
      case 'external':
        const writeFunctions =
          contractsState[selectedContract?.address].writeState
        const newWriteFns = writeFunctions.map((rf) => {
          if (rf.name === funcName) {
            return {
              ...rf,
              inputs: rf.inputs.map((prev) => {
                const { rawInput, ...rest } = prev
                return rest
              })
            }
          }
          return rf
        })
        setWriteState(newWriteFns)
        break
    }
  }

  const propogateInputToState = async (
    type: 'view' | 'external',
    funcName: string,
    inputName: string,
    newValue?: string
  ) => {
    if (selectedContract == null) {
      console.error('No Contract Selected!!')
      return
    }
    switch (type) {
      case 'view':
        const readFunctions =
          contractsState[selectedContract?.address].readState
        const newReadFns = readFunctions.map((rf) => {
          if (rf.name === funcName) {
            const oldInputIdx = rf.inputs.findIndex((i) => i.name === inputName)
            if (oldInputIdx !== -1) {
              const oldInput = rf.inputs[oldInputIdx]
              const newInput = {
                ...oldInput,
                rawInput: newValue
              }
              const newInputs = rf.inputs.map((i, idx) => {
                if (idx === oldInputIdx) return newInput
                return i
              })
              return {
                ...rf,
                inputs: newInputs
              }
            }
          }
          return rf
        })
        setReadState(newReadFns)
        break
      case 'external':
        const writeFunctions =
          contractsState[selectedContract?.address].writeState
        const newWriteFns = writeFunctions.map((rf) => {
          if (rf.name === funcName) {
            const oldInputIdx = rf.inputs.findIndex((i) => i.name === inputName)
            if (oldInputIdx !== -1) {
              const oldInput = rf.inputs[oldInputIdx]
              const newInput = {
                ...oldInput,
                rawInput: newValue
              }
              const newInputs = rf.inputs.map((i, idx) => {
                if (idx === oldInputIdx) return newInput
                return i
              })
              return {
                ...rf,
                inputs: newInputs
              }
            }
          }
          return rf
        })
        setWriteState(newWriteFns)
        break
    }
  }

  const makeCallDataAndHandleCall = async (
    finalIPs: any,
    type: 'view' | 'external',
    funcName: string
  ) => {
    if (selectedContract == null) {
      console.error('No Contract Selected!!')
      return
    }
    switch (type) {
      case 'view':
        const readFunctions =
          contractsState[selectedContract?.address].readState
        const calledReadFn = readFunctions.find((rf) => rf.name === funcName)
        if (calledReadFn != null) {
          const transformedCallData = makeCallDatafromInput(
            calledReadFn.inputs,
            finalIPs
          )
          await handleCall(funcName, 'view', transformedCallData)
        }
        break
      case 'external':
        const writeFunctions =
          contractsState[selectedContract?.address].writeState
        const calledWriteFn = writeFunctions.find((rf) => rf.name === funcName)
        if (calledWriteFn != null) {
          const transformedCallData = makeCallDatafromInput(
            calledWriteFn.inputs,
            finalIPs
          )
          await handleCall(funcName, 'external', transformedCallData)
        }
        break
    }
  }

  const handleCall = async (
    name: string,
    type: 'view' | 'external',
    callData: CallDataObj[]
  ): Promise<void> => {
    remixClient.emit('statusChanged', {
      key: 'loading',
      type: 'info',
      title: `Calling ${name}...`
    })
    props.setInteractionStatus('loading')
    try {
      if (selectedContract == null) {
        console.error('No Contract Selected!!')
        return
      }

      if (type === 'view') {
        const callFunction = getCall(
          selectedContract.address,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
          name,
          (callData?.flat() as BigNumberish[]) ?? []
        )
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        const response = await callFunction(account!)
        writeResponse(response, name, type)
        setResponses((responses) => [
          ...responses,
          {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
            functionName: name,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
            contractName: selectedContract?.name,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
            contractAddress: selectedContract?.address,
            callResponse: response
          }
        ])
        remixClient.emit('statusChanged', {
          key: 'succeed',
          type: 'success',
          title: 'Function call succeeded, results are written to the terminal log'
        })
      } else {
        const invocation = getInvocation(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
          selectedContract?.address,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
          name,
          (callData?.flat() as BigNumberish[]) ?? []
        )
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        const response = await invocation(account!)
        const resultOfTx = await provider?.waitForTransaction(
          response.transaction_hash
        )
        console.log(
          'Transaction:',
          await account?.getTransaction(response.transaction_hash)
        )
        if (resultOfTx != null) {
          console.log('Writing Result of txn')
          writeResponse(resultOfTx, name, type)
        }
        setResponses((responses) => [
          ...responses,
          {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
            functionName: name,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
            contractName: selectedContract?.name,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
            contractAddress: selectedContract?.address,
            invocationResponse: resultOfTx
          }
        ])
        remixClient.emit('statusChanged', {
          key: 'succeed',
          type: 'success',
          title: 'Transaction sent with Hash: ' + response.transaction_hash
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

      { (contracts.length > 0 && selectedContract != null) && ((account != null &&
      selectedContract != null) &&
      selectedContract.deployedInfo.some(
        (info) => info.address === account.address && info.chainId === chainId
      ) ? (
        // eslint-disable-next-line multiline-ternary
        <>
          <div className="read-functions-wrapper">
            {selectedContract &&
              contractsState[selectedContract.address]?.readState?.map(
                (func, _index) => {
                  const init: any = func.inputs.reduce((p, c) => {
                    return {
                      ...p,
                      // Check if already has a rawInput in storage
                      [c.name]: c.rawInput ?? ''
                    }
                  }, {})

                  const validationSchema = func.inputs.reduce((p, c) => {
                    return {
                      ...p,
                      [c.name]: Yup.string()
                        .required(`${c.name} is required.`)
                        // @ts-expect-error because validate_ip is not a function of Yup
                        .validate_ip(c.type)
                    }
                  }, {})

                  return (
                    <div className="form-function-wrapper">
                      <Formik
                        initialValues={{ ...init }}
                        onSubmit={(finalState, { setSubmitting }) => {
                          makeCallDataAndHandleCall(
                            finalState,
                            'view',
                            func?.name
                          ).catch((e) => {
                            console.error(e)
                          })
                          setSubmitting(false)
                        }}
                        validationSchema={Yup.object().shape({
                          ...validationSchema
                        })}
                      >
                        {(props) => {
                          const {
                            values,
                            touched,
                            errors,
                            isSubmitting,
                            handleChange,
                            handleBlur,
                            handleSubmit,
                            handleReset
                          } = props

                          // console.log(values, errors)
                          return (
                            <form
                              className="function-label-wrapper"
                              style={{ display: 'flex' }}
                              onSubmit={handleSubmit}
                            >
                              <div className="form-action-wrapper">
                                <button
                                  className={
                                    "udapp_instanceButton undefined btn btn-sm btn-warning 'w-100'"
                                  }
                                  type="submit"
                                  disabled={isSubmitting}
                                >
                                  {func.name}
                                </button>
                                <button
                                  className={'btn btn-sm reset'}
                                  onClick={(e) => {
                                    clearRawInputs('view', func.name).catch((e) => {
                                      console.error(e)
                                    })
                                    handleReset(e)
                                  }}
                                >
                                  <BiReset />
                                </button>
                              </div>
                              <div className={'function-inputs'}>
                                {func.inputs.length > 0 &&
                                  func.inputs.map((input, _index) => {
                                    return (
                                      <div className="input-func-wrapper">
                                        <div className="hint">
                                          {errors[input.name] &&
                                            touched[input.name] && (
                                              <div className="input-feedback text-danger">
                                                {(errors as any)[input?.name]}
                                              </div>
                                          )}
                                        </div>
                                        <input
                                          name={input.name}
                                          value={values[input.name]}
                                          data-datatype={input.type}
                                          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                                          placeholder={`${
                                            input.name
                                          } (${getParameterType(input.type) ?? ''})`}
                                          onBlur={handleBlur}
                                          disabled={isSubmitting}
                                          className={
                                            errors[input.name] &&
                                            touched[input.name]
                                              ? 'form-control function-input function-error text-danger'
                                              : 'form-control function-input'
                                          }
                                          onChange={(e) => {
                                            handleChange(e)
                                            // Propogate to rawInputs in storage.
                                            propogateInputToState(
                                              'view',
                                              func.name,
                                              input.name,
                                              e.target.value
                                            ).catch((e) => {
                                              console.error(e)
                                            })
                                          }}
                                        />
                                      </div>
                                    )
                                  })}
                              </div>
                            </form>
                          )
                        }}
                      </Formik>
                    </div>
                  )
                }
              )}
          </div>
          {selectedContract &&
            contractsState[selectedContract.address]?.writeState?.map(
              (func, index) => {
                const init: any = func.inputs.reduce((p, c) => {
                  return {
                    ...p,
                    [c.name]: c.rawInput ?? ''
                  }
                }, {})

                const validationSchema = func.inputs.reduce((p, c) => {
                  return {
                    ...p,
                    [c.name]: Yup.string()
                      .required(`${c.name} is required.`)
                      // @ts-expect-error because validate_ip is not a function of Yup
                      .validate_ip(c.type)
                  }
                }, {})
                return (
                  <>
                    <div className="form-function-wrapper" key={index}>
                      <Formik
                        initialValues={{ ...init }}
                        onSubmit={(finalState, { setSubmitting }) => {
                          // console.log(
                          //   finalState,
                          //   'this conforms to init state'
                          // )
                          makeCallDataAndHandleCall(
                            finalState,
                            'external',
                            func?.name
                          ).catch((e) => {
                            console.error(e)
                          })
                          setSubmitting(false)
                        }}
                        validationSchema={Yup.object().shape({
                          ...validationSchema
                        })}
                      >
                        {(props) => {
                          const {
                            values,
                            touched,
                            errors,
                            isSubmitting,
                            handleChange,
                            handleBlur,
                            handleSubmit,
                            handleReset
                          } = props

                          // console.log(values, errors)
                          return (
                            <form
                              className="function-label-wrapper"
                              style={{ display: 'flex' }}
                              key={index}
                              onSubmit={handleSubmit}
                            >
                              <div className="form-action-wrapper">
                                <button
                                  className={
                                    "udapp_instanceButton undefined btn btn-sm btn-info 'w-100'"
                                  }
                                  data-name={func.name}
                                  data-type={func.state_mutability}
                                  type="submit"
                                  disabled={isSubmitting}
                                >
                                  {func.name}
                                </button>
                                <button
                                  className={'btn btn-sm reset'}
                                  onClick={(e) => {
                                    clearRawInputs('external', func.name).catch((e) => {
                                      console.error(e)
                                    })
                                    handleReset(e)
                                  }}
                                >
                                  <BiReset />
                                </button>
                              </div>
                              <div className={'function-inputs'}>
                                {func.inputs.length > 0 &&
                                  func.inputs.map((input, index) => {
                                    return (
                                      <div className="input-func-wrapper">
                                        <div className="hint">
                                          {errors[input.name] &&
                                            touched[input.name] && (
                                              <div className="input-feedback text-danger">
                                                {(errors as any)[input?.name]}
                                              </div>
                                          )}
                                        </div>
                                        <input
                                          name={input.name}
                                          value={values[input.name]}
                                          data-datatype={input.type}
                                          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                                          placeholder={`${
                                            input.name
                                          } (${getParameterType(input.type)})`}
                                          onBlur={handleBlur}
                                          disabled={isSubmitting}
                                          className={
                                            errors[input.name] &&
                                            touched[input.name]
                                              ? 'form-control function-input function-error text-danger'
                                              : 'form-control function-input'
                                          }
                                          onChange={(e) => {
                                            handleChange(e)
                                            // Propogate to rawInputs in storage.
                                            propogateInputToState(
                                              'external',
                                              func.name,
                                              input.name,
                                              e.target.value
                                            ).catch((e) => {
                                              console.error(e)
                                            })
                                          }}
                                          key={index}
                                        />
                                      </div>
                                    )
                                  })}
                              </div>
                            </form>
                          )
                        }}
                      </Formik>
                    </div>
                  </>
                )
              }
            )}
        </>
          ) : (
        <p> Selected contract is not deployed yet... </p>
          ))}
    </Container>
  )
}

export default Interaction
