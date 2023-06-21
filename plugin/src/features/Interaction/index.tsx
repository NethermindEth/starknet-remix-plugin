import React, { useContext, useEffect, useState } from 'react'
import { type BigNumberish } from 'ethers'

import {
  type Account,
  type RawCalldata,
  uint256,
  type CallContractResponse,
  type GetTransactionReceiptResponse,
  type AccountInterface,
  type InvokeFunctionResponse
} from 'starknet'
import CompiledContracts from '../../components/CompiledContracts'
import { CompiledContractsContext } from '../../contexts/CompiledContractsContext'
import { type AbiElement } from '../../types/contracts'
import { getReadFunctions, getWriteFunctions } from '../../utils/utils'
import Container from '../../ui_components/Container'
import { ConnectionContext } from '../../contexts/ConnectionContext'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface InteractionProps {}

const Interaction: React.FC<InteractionProps> = () => {
  const [readFunctions, setReadFunctions] = useState<AbiElement[]>([])
  const [writeFunctions, setWriteFunctions] = useState<AbiElement[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const { contracts, selectedContract } = useContext(CompiledContractsContext)

  const { account, provider } = useContext(ConnectionContext)

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
        const calldataIndices: number[] = func.inputs.reduce<number[]>(
          (calldataIndices: number[], input, index: number) => {
            if (index === 0) {
              calldataIndices[0] = 0
              return calldataIndices
            }
            if (func.inputs[index - 1].type.endsWith('u256')) {
              calldataIndices.push(calldataIndices[index - 1] + 2)
              return calldataIndices
            } else {
              calldataIndices.push(calldataIndices[index - 1] + 1)
              return calldataIndices
            }
          },
          []
        )
        return { ...func, calldataIndices }
      })

      writeFunctions = writeFunctions.map((func) => {
        const calldataIndices: number[] = func.inputs.reduce<number[]>(
          (calldataIndices: number[], input, index: number) => {
            if (index === 0) {
              calldataIndices[0] = 0
              return calldataIndices
            }
            if (func.inputs[index - 1].type.endsWith('u256')) {
              calldataIndices.push(calldataIndices[index - 1] + 2)
              return calldataIndices
            } else {
              calldataIndices.push(calldataIndices[index - 1] + 1)
              return calldataIndices
            }
          },
          []
        )
        return { ...func, calldataIndices }
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
      return response
    }
    return call
  }

  // Handle calldata change
  const handleCalldataChange = (e: any): void => {
    const { name, value, dataset } = e.target
    const { type, index, datatype } = dataset
    if (type === 'view') {
      const functionIndex = getFunctionIndex(name, readFunctions)
      const newReadFunctions = [...readFunctions]
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (datatype && (datatype as string).endsWith('u256')) {
        const calldataElementIndex =
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          newReadFunctions[functionIndex].calldataIndices![parseInt(index)]
        const uint = uint256.bnToUint256(value)
        if (newReadFunctions[functionIndex].calldata == null) {
          newReadFunctions[functionIndex].calldata = []
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        newReadFunctions[functionIndex].calldata![calldataElementIndex] =
          uint.low
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        newReadFunctions[functionIndex].calldata![calldataElementIndex + 1] =
          uint.high
      } else {
        const calldataElementIndex =
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          newReadFunctions[functionIndex].calldataIndices![parseInt(index)]
        if (newReadFunctions[functionIndex].calldata == null) {
          newReadFunctions[functionIndex].calldata = []
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        newReadFunctions[functionIndex].calldata![calldataElementIndex] = value
      }
      setReadFunctions(newReadFunctions)
    }
    if (type === 'external') {
      const functionIndex = getFunctionIndex(name, writeFunctions)
      const newWriteFunctions = [...writeFunctions]
      console.log('Datatype', datatype)

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (datatype && (datatype as string).endsWith('u256')) {
        const calldataElementIndex =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          newWriteFunctions[functionIndex].calldataIndices![parseInt(index)]
        const uint = uint256.bnToUint256(value)
        if (newWriteFunctions[functionIndex].calldata == null) {
          newWriteFunctions[functionIndex].calldata = []
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        newWriteFunctions[functionIndex].calldata![calldataElementIndex] =
          uint.low
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        newWriteFunctions[functionIndex].calldata![calldataElementIndex + 1] =
          uint.high
      } else {
        console.log('THIS', functionIndex, newWriteFunctions[functionIndex])
        const calldataElementIndex =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          newWriteFunctions[functionIndex].calldataIndices![parseInt(index)]
        if (newWriteFunctions[functionIndex].calldata == null) {
          newWriteFunctions[functionIndex].calldata = []
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        newWriteFunctions[functionIndex].calldata![calldataElementIndex] = value
      }
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
      console.log(func)
      const callFunction = getCall(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        selectedContract?.address!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
        func?.name!,
        func?.calldata?.flat() as BigNumberish[] ?? []
      )
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
      const response = await callFunction(account!)
      console.log(response)
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
      console.log(func?.calldata)
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
                      placeholder={`${input.name} (${input.type
                        .split('::')
                        .pop()})`}
                      onChange={handleCalldataChange}
                      key={index}
                    />
                  )
                })}
            </div>
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
                      placeholder={`${input.name} (${input.type
                        .split('::')
                        .pop()})`}
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
