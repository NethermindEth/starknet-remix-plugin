import React, { useEffect, useState } from 'react'
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
import { type CallDataObj, type Input } from '../../utils/types/contracts'
import {
  getParameterType,
  getReadFunctions,
  getWriteFunctions
} from '../../utils/utils'
import Container from '../../components/ui_components/Container'
import storage from '../../utils/storage'
import './index.css'
import { useAtom, useAtomValue } from 'jotai'
import { type EnhancedAbiElement, interactAtom, type UiAbiState } from '../../atoms'
import { Formik, type FormikProps } from 'formik'
import Yup, { transformInputs } from '../../utils/yup'

import { BiReset } from 'react-icons/bi'
import transactionsAtom from '../../atoms/transactions'
import { compiledContractsAtom, selectedCompiledContract } from '../../atoms/compiledContracts'
import { envAtom } from '../../atoms/environment'
import useAccount from '../../hooks/useAccount'
import useProvider from '../../hooks/useProvider'
import useRemixClient from '../../hooks/useRemixClient'
import { isEmpty } from '../../utils/misc'

interface InteractionProps {
  setInteractionStatus: React.Dispatch<React.SetStateAction<'loading' | 'error' | 'success' | ''>>
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

  // console.log(contractsState[selectedContract?.address!])

  const setReadState = (readState: EnhancedAbiElement[]): void => {
    if (selectedContract != null) {
      setContractsState({
        ...contractsState,
        [selectedContract?.address]: {
          ...contractsState[selectedContract?.address],
          readState: [...readState]
        }
      })
    }
+  const [preDeployedAddress, setPreDeployedAddress] = useState<string | null>(null)
=======
```
```
<<<<<<< APPEND (index=0)
+                <div className="udapp_multiArg constructor-label-wrapper">
+                  <label className="constructor-label">
+                    {"Pre-deployed Address: "}
+                  </label>
+                  <input
+                    className="form-control constructor-input"
+                    name="preDeployedAddress"
+                    value={preDeployedAddress ?? ''}
+                    onChange={(event) => setPreDeployedAddress(event.target.value)}
+                  />
+                </div>
=======
```
```
<<<<<<< REPLACE (index=3)
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
=======
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
        contractAddress: preDeployedAddress ?? contractAddress,
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
  const setWriteState = (writeState: EnhancedAbiElement[]): void => {
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
  ): void => {
    if (selectedContract != null) {
      const currentContractObj = contractsState[selectedContract.address]
      switch (stateType) {
        case 'view':
        {
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
        }
        case 'external':
        {
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
      const oldContractObj: undefined | UiAbiState = contractsState[selectedContract.address]
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
        contractAddress: preDeployedAddress ?? contractAddress,
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
        if (!isEmpty(c.name)) {
          if (!isEmpty(finalInputForm[c.name])) {
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

  const clearRawInputs = (
    type: 'view' | 'external',
    funcName: string
  ): void => {
    if (selectedContract == null) {
      console.error('No Contract Selected!!')
      return
    }
    switch (type) {
      case 'view':
      {
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
      }
      case 'external':
      {
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
  }

  const propogateInputToState = (
    type: 'view' | 'external',
    funcName: string,
    inputName: string,
    newValue?: string
  ): void => {
    if (selectedContract == null) {
      console.error('No Contract Selected!!')
      return
    }
    switch (type) {
      case 'view':
      {
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
      }
      case 'external':
      {
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
  }

  const makeCallDataAndHandleCall = (
    finalIPs: any,
    type: 'view' | 'external',
    funcName: string
  ): void => {
    if (selectedContract == null) {
      console.error('No Contract Selected!!')
      return
    }
    switch (type) {
      case 'view':
      {
        const readFunctions =
            contractsState[selectedContract?.address].readState
        const calledReadFn = readFunctions.find((rf) => rf.name === funcName)
        if (calledReadFn != null) {
          const transformedCallData = makeCallDatafromInput(
            calledReadFn.inputs,
            finalIPs
          )
          handleCall(funcName, 'view', transformedCallData).catch(e => { console.error(e) })
        }
        break
      }
      case 'external':
      {
        const writeFunctions =
            contractsState[selectedContract?.address].writeState
        const calledWriteFn = writeFunctions.find((rf) => rf.name === funcName)
        if (calledWriteFn != null) {
          const transformedCallData = makeCallDatafromInput(
            calledWriteFn.inputs,
            finalIPs
          )
          handleCall(funcName, 'external', transformedCallData).catch(e => { console.error(e) })
        }
        break
      }
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
      if (selectedContract === null) {
        console.error('No Contract Selected!!')
        return
      }

      if (account === null || account === undefined) {
        console.error('No account selected.')
        return
      }

      if (type === 'view') {
        const callFunction = getCall(
          selectedContract.address,
          name,
          (callData?.flat() as BigNumberish[]) ?? []
        )
        const response = await callFunction(account)
        writeResponse(response, name, type)
        setResponses((responses) => [
          ...responses,
          {
            functionName: name,
            contractName: selectedContract?.name,
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
          preDeployedAddress ?? selectedContract?.address,
          name,
          (callData?.flat() as BigNumberish[]) ?? []
        )
        const response = await invocation(account)
        const resultOfTx = await provider?.waitForTransaction(
          response.transaction_hash
        )
        await remixClient.call('terminal', 'log', {
          value: JSON.stringify({
            resultOfTx,
            contract: selectedContract?.name,
            function: name
          }),
          type: 'info'
        })
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
            functionName: name,
            contractName: selectedContract?.name,
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
  const isContractSelected = contracts.length > 0 && selectedContract != null && selectedContract !== undefined
  const isAccountAndContractValid = isContractSelected && account != null && selectedContract.deployedInfo.some(
    (info) => info.address === account.address && info.chainId === chainId
  )

  return (
    <Container>
      {contracts.length > 0 && selectedContract != null
        ? (
          <CompiledContracts show="contract" />
          )
        : (
          <div>
            <p>No compiled contracts to interact with... Yet.</p>
          </div>
          )}

      {isContractSelected && isAccountAndContractValid
        ? <>
          <div className="read-functions-wrapper">
            {contractsState[selectedContract.address]?.readState?.map(
              (func, index) => {
                const init: Record<string, string> = func.inputs.reduce((p, c) => {
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
                  <div className="form-function-wrapper" key={index?.toString() + func.name}>
                    <Formik
                      initialValues={{ ...init }}
                      onSubmit={(finalState, { setSubmitting }) => {
                        makeCallDataAndHandleCall(
                          finalState,
                          'view',
                          func?.name
                        )
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
                                  clearRawInputs('view', func.name)
                                  handleReset(e)
                                }}
                              >
                                <BiReset />
                              </button>
                            </div>
                            <div className={'function-inputs'}>
                              {func.inputs.length > 0 &&
                                func.inputs.map((input, index) => {
                                  const hasErrors = (!isEmpty(errors[input.name]) && touched[input.name]) ?? false
                                  return (
                                    <div className="input-func-wrapper" key={index.toString() + input.name}>
                                      <div className="hint">
                                        {hasErrors && (
                                          <div className="input-feedback text-danger">
                                            {(errors as any)[input?.name]}
                                          </div>
                                        )}
                                      </div>
                                      <input
                                        name={input.name}
                                        value={values[input.name]}
                                        data-datatype={input.type}
                                        placeholder={`${input.name
                                          } (${getParameterType(input.type) ?? ''})`}
                                        onBlur={handleBlur}
                                        disabled={isSubmitting}
                                        className={
                                          hasErrors
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
                                          )
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
          {contractsState[selectedContract.address]?.writeState?.map(
            (func, index) => {
              const init: Record<string, any> = func.inputs.reduce((p, c) => {
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
                        makeCallDataAndHandleCall(
                          finalState,
                          'external',
                          func?.name
                        )
                        setSubmitting(false)
                      }}
                      validationSchema={Yup.object().shape({
                        ...validationSchema
                      })}
                    >
                      {(props: FormikProps<Record<string, any>>) => {
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
                                  clearRawInputs('external', func.name)
                                  handleReset(e)
                                }}
                              >
                                <BiReset />
                              </button>
                            </div>
                            <div className={'function-inputs'}>
                              {func.inputs.length > 0 &&
                                func.inputs.map((input, index) => {
                                  const hasErrors = (errors[input.name] != null && touched[input.name] != null) ?? false
                                  return (
                                    <div className="input-func-wrapper" key={index.toString() + input.name}>
                                      <div className="hint">
                                        {hasErrors && (
                                          <div className="input-feedback text-danger">
                                            {(errors as any)[input?.name]}
                                          </div>
                                        )}
                                      </div>
                                      <input
                                        name={input.name}
                                        value={values[input.name]}
                                        data-datatype={input.type}
                                        placeholder={`${input.name
                                          } (${getParameterType(input.type)})`}
                                        onBlur={handleBlur}
                                        disabled={isSubmitting}
                                        className={
                                          hasErrors
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
                                          )
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
        : <p> Selected contract is not deployed yet... </p>
      }
    </Container>
  )
}

+  const [preDeployedAddress, setPreDeployedAddress] = useState<string | null>(null)
=======
```
```
<<<<<<< APPEND (index=2)
+                <div className="udapp_multiArg constructor-label-wrapper">
+                  <label className="constructor-label">
+                    {"Pre-deployed Address: "}
+                  </label>
+                  <input
+                    className="form-control constructor-input"
+                    name="preDeployedAddress"
+                    value={preDeployedAddress ?? ''}
+                    onChange={(event) => setPreDeployedAddress(event.target.value)}
+                  />
+                </div>
=======
```
```
<<<<<<< REPLACE (index=1)
        const invocation = getInvocation(
          selectedContract?.address,
          name,
          (callData?.flat() as BigNumberish[]) ?? []
        )
        const response = await invocation(account)
=======
        const invocation = getInvocation(
          preDeployedAddress ?? selectedContract?.address,
          name,
          (callData?.flat() as BigNumberish[]) ?? []
        )
        const response = await invocation(account)

export default Interaction
