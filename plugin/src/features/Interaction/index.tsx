import React, { useContext, useEffect, useState } from 'react'
import { BigNumber, type BigNumberish } from 'ethers'

import {
  Account,
  type RawCalldata,
  type CallContractResponse,
  type GetTransactionReceiptResponse,
  type AccountInterface,
  type InvokeFunctionResponse
} from 'starknet'
import CompiledContracts from '../../components/CompiledContracts'
import { CompiledContractsContext } from '../../contexts/CompiledContractsContext'
import { type CallDataObj, type AbiElement, Input } from '../../types/contracts'
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
import { BsArrowReturnRight, BsHash } from 'react-icons/bs'
import { Formik } from 'formik'
import Yup, { transformInputs } from '../../utils/yup'

import { BiReset } from 'react-icons/bi'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
type InteractionProps = {}

const Interaction: React.FC<InteractionProps> = () => {
  const { contracts, selectedContract } = useContext(CompiledContractsContext)
  const { account, provider } = useContext(ConnectionContext)

  const { transactions, setTransactions } = useContext(TransactionContext)
  const remixClient = useContext(RemixClientContext)

  const [contractsState, setContractsState] = useAtom(interactAtom)

  console.log(contractsState[selectedContract?.address!])

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
          const oldElemIdx = readState.findIndex(
            (r_obj) => r_obj.name === funcName
          )
          if (oldElemIdx !== -1) {
            const oldElem = readState[oldElemIdx]
            const newElem = {
              ...oldElem,
              callResponse: response as CallContractResponse
            }
            const newReadState = readState.map((r_obj) => {
              if (r_obj.name === funcName) {
                return newElem
              }
              return r_obj
            })
            if (responseType === 'call') {
              setContractsState({
                ...contractsState,
                [selectedContract?.address]: {
                  ...currentContractObj,
                  readState: newReadState
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
                  readState: newReadState
                }
              })
            } /// If no old elem found, no need to udpate
          }
          break
        case 'write':
          const writeState = currentContractObj.writeState
          const oldElemWIdx = writeState.findIndex(
            (r_obj) => r_obj.name === funcName
          )
          if (oldElemWIdx !== -1) {
            const oldElemW = writeState[oldElemWIdx]
            const newElemW = {
              ...oldElemW,
              invocationResponse: response as InvokeFunctionResponse
            }
            const newWriteStateFunc = writeState.map((r_obj) => {
              if (r_obj.name === funcName) {
                return newElemW
              }
              return r_obj
            })
            if (responseType === 'call') {
              setContractsState({
                ...contractsState,
                [selectedContract?.address]: {
                  ...currentContractObj,
                  writeState: newWriteStateFunc
                }
              })
            } else if (responseType === 'invoke') {
              setContractsState({
                ...contractsState,
                [selectedContract?.address]: {
                  ...currentContractObj,
                  writeState: newWriteStateFunc
                }
              })
            }
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

  const makeCallDatafromInput = (
    input: Input[],
    finalInputForm: any
  ): CallDataObj[] => {
    let inputs: CallDataObj[] = []
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

  const propogateStateToCalldata = (
    finalIPs: any,
    type: 'view' | 'external',
    funcName: string
  ) => {
    if (!selectedContract) {
      console.error('No Contract Selected!!')
      return
    }
    switch (type) {
      case 'view':
        const readFunctions =
          contractsState[selectedContract?.address].readState
        const newReadFns = readFunctions.map((rf) => {
          if (rf.name === funcName) {
            const transformedCallData = makeCallDatafromInput(
              rf.inputs,
              finalIPs
            )
            const new_rf = {
              ...rf,
              calldata: transformedCallData
            }

            return new_rf
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
            const transformedCallData = makeCallDatafromInput(
              rf.inputs,
              finalIPs
            )
            const new_rf = {
              ...rf,
              calldata: transformedCallData
            }

            return new_rf
          }
          return rf
        })
        setWriteState(newWriteFns)
        break
    }
  }

  const getFunctionFromName = (
    name: string,
    functions: AbiElement[]
  ): AbiElement | undefined => {
    return functions.find((func) => func.name === name)
  }

  const handleCall = async (
    name: string,
    type: 'view' | 'external'
  ): Promise<void> => {
    if (!selectedContract) {
      console.error('No Contract Selected!!')
      return
    }
    console.log(name, type)

    if (type === 'view') {
      const readFunctions = contractsState[selectedContract?.address].readState
      const func = getFunctionFromName(name, readFunctions)

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
                  const init: any = func.inputs.reduce((p, c) => {
                    return {
                      ...p,
                      [c.name]: ''
                    }
                  }, {})

                  const validationSchema = func.inputs.reduce((p, c) => {
                    return {
                      ...p,
                      [c.name]: Yup.string()
                        .required(`${c.name} is required.`)
                        // @ts-ignore
                        .validate_ip(c.type)
                    }
                  }, {})

                  return (
                    <div className="form-function-wrapper">
                      <Formik
                        initialValues={{ ...init }}
                        onSubmit={(final_state, { resetForm }) => {
                          // console.log(
                          //   final_state,
                          //   'this conforms to init state'
                          // )
                          propogateStateToCalldata(
                            final_state,
                            'view',
                            func?.name
                          )
                          handleCall(
                            func.name,
                            func?.state_mutability === 'view'
                              ? 'view'
                              : 'external'
                          )
                          resetForm()
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
                                  className={`udapp_instanceButton undefined btn btn-sm btn-warning 'w-100'`}
                                  data-name={func.name}
                                  data-type={func.state_mutability}
                                  type="submit"
                                  disabled={isSubmitting}
                                >
                                  {func.name}
                                </button>
                                <button
                                  className={'btn btn-sm reset'}
                                  onClick={handleReset}
                                >
                                  <BiReset />
                                </button>
                              </div>
                              <div className={`function-inputs`}>
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
                                          onChange={handleChange}
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
                      <div className="w-100">
                        <span className="response-type-wrapper">
                          <p>
                            {func?.outputs && (
                              <BsArrowReturnRight
                                style={{ marginRight: '10px' }}
                              />
                            )}
                            {func?.outputs &&
                              func.outputs?.map((o) => o.type).join(',')}
                          </p>
                        </span>
                        {func.callResponse?.result && (
                          <p>{JSON.stringify(func.callResponse.result)}</p>
                        )}
                      </div>
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
                    [c.name]: ''
                  }
                }, {})

                const validationSchema = func.inputs.reduce((p, c) => {
                  return {
                    ...p,
                    [c.name]: Yup.string()
                      .required(`${c.name} is required.`)
                      // @ts-ignore
                      .validate_ip(c.type)
                  }
                }, {})
                return (
                  <>
                    <div className="form-function-wrapper" key={index}>
                      <Formik
                        initialValues={{ ...init }}
                        onSubmit={(final_state, { resetForm }) => {
                          // console.log(
                          //   final_state,
                          //   'this conforms to init state'
                          // )
                          propogateStateToCalldata(
                            final_state,
                            'external',
                            func?.name
                          )
                          handleCall(
                            func.name,
                            func.state_mutability === 'view'
                              ? 'view'
                              : 'external'
                          )
                          resetForm()
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
                                  className={`udapp_instanceButton undefined btn btn-sm btn-info 'w-100'`}
                                  data-name={func.name}
                                  data-type={func.state_mutability}
                                  type="submit"
                                  disabled={isSubmitting}
                                >
                                  {func.name}
                                </button>
                                <button
                                  className={'btn btn-sm reset'}
                                  onClick={handleReset}
                                >
                                  <BiReset />
                                </button>
                              </div>
                              <div className={`function-inputs`}>
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
                                          onChange={handleChange}
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
                      <div className="response-wrapper w-100">
                        {func?.invocationResponse?.transaction_hash && (
                          <BsArrowReturnRight />
                        )}
                        {func?.invocationResponse?.transaction_hash && (
                          <span className="d-flex">
                            {' '}
                            <BsHash size={24} />
                            <p
                              title={func?.invocationResponse?.transaction_hash}
                            >
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
