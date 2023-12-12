import React, { useEffect, useState } from 'react'

import { type BigNumberish } from 'ethers'
import CompiledContracts from '../../components/CompiledContracts'
import {
  type CallDataObj,
  type CallDataObject,
  type Contract
} from '../../utils/types/contracts'
import { getConstructor, getParameterType, getShortenedHash } from '../../utils/utils'
import Container from '../../components/ui_components/Container'

import { type AccordianTabs } from '../Plugin'
import { constants } from 'starknet'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import transactionsAtom from '../../atoms/transactions'

import './styles.css'
import {
  compiledContractsAtom,
  selectedCompiledContract
} from '../../atoms/compiledContracts'
import { envAtom } from '../../atoms/environment'
// import { starknetWindowObject as starknetWindowObjectAtom } from '../../atoms/connection'
import useAccount from '../../hooks/useAccount'
import useProvider from '../../hooks/useProvider'
import useRemixClient from '../../hooks/useRemixClient'
import {
  constructorInputsAtom,
  deployStatusAtom,
  declStatusAtom,
  deploymentAtom,
  isDeployingAtom,
  isDelcaringAtom,
  notEnoughInputsAtom,
  declTxHashAtom,
  deployTxHashAtom
} from '../../atoms/deployment'
import Tooltip from '../../components/ui_components/Tooltip'

import { FaInfoCircle } from 'react-icons/fa'
import { useWaitForTransaction } from '@starknet-react/core'
interface DeploymentProps {
  setActiveTab: (tab: AccordianTabs) => void
}

const Deployment: React.FC<DeploymentProps> = ({ setActiveTab }) => {
  const { remixClient } = useRemixClient()
  const { account } = useAccount()
  const { provider } = useProvider()

  const [contracts, setContracts] = useAtom(compiledContractsAtom)
  const [selectedContract, setSelectedContract] = useAtom(
    selectedCompiledContract
  )

  const [constructorCalldata, setConstructorCalldata] =
    useState<CallDataObject>({})

  const { isDeploying, deployStatus, isDeclaring, declStatus, constructorInputs, notEnoughInputs, declTxHash, deployTxHash } =
    useAtomValue(deploymentAtom)

  const setIsDeploying = useSetAtom(isDeployingAtom)
  const setDeployStatus = useSetAtom(deployStatusAtom)
  const setIsDeclaring = useSetAtom(isDelcaringAtom)
  const setDeclStatus = useSetAtom(declStatusAtom)
  const setConstructorInputs = useSetAtom(constructorInputsAtom)
  const setNotEnoughInputs = useSetAtom(notEnoughInputsAtom)
  const setDeclTxHash = useSetAtom(declTxHashAtom)
  const setDeployTxHash = useSetAtom(deployTxHashAtom)

  const [transactions, setTransactions] = useAtom(transactionsAtom)
  const env = useAtomValue(envAtom)

  const declTxStatus = useWaitForTransaction({ hash: declTxHash, watch: true })
  const deployTxStatus = useWaitForTransaction({ hash: deployTxHash, watch: true })

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
    setConstructorCalldata({})
    if (selectedContract != null) {
      setConstructorInputs(getConstructor(selectedContract?.abi)?.inputs ?? [])
    }
  }, [selectedContract])

  useEffect(() => {
    if (declTxHash === '') return
    if (declTxStatus.status === 'success') {
      setDeclStatus('done')
      setIsDeclaring(false)
      remixClient.emit('statusChanged', {
        key: 'succeed',
        type: 'success',
        title: `Contract ${selectedContract?.name ?? ''} declared!`
      })
    }
    if (declTxStatus.status === 'error') {
      setDeclStatus('error')
      setIsDeclaring(false)
    }
    if (declTxStatus.status === 'pending') {
      setDeclStatus('pending')
      setIsDeclaring(true)
    }
  }, [declTxStatus])

  useEffect(() => {
    if (deployTxHash === '') return
    if (deployTxStatus.status === 'success') {
      setDeployStatus('done')
      setIsDeploying(false)
      remixClient.emit('statusChanged', {
        key: 'succeed',
        type: 'success',
        title: `Contract ${selectedContract?.name ?? ''} deployed!`
      })
    }
    if (deployTxStatus.status === 'error') {
      setDeployStatus('error')
      setIsDeploying(false)
    }
    if (deployTxStatus.status === 'pending') {
      setDeployStatus('pending')
      setIsDeploying(true)
    }
  }, [deployTxStatus])

  const declare = async (): Promise<void> => {
    setIsDeclaring(true)
    remixClient.emit('statusChanged', {
      key: 'loading',
      type: 'info',
      title: `Declaring ${selectedContract?.name ?? ''} ...`
    })

    let updatedTransactions = transactions

    try {
      if (account === null || provider === null) {
        throw new Error('No account or provider selected!')
      }

      if (selectedContract === null) {
        throw new Error('No contract selected for deployment!')
      }
      setDeclStatus('Declaring...')
      try {
        try {
          await account.getClassByHash(selectedContract.classHash)
          await remixClient.call(
            'notification' as any,
            'toast',
            `ℹ️ Contract with classHash: ${getShortenedHash(
              selectedContract.classHash,
              6,
              4
            )} already has been declared, proceeding to deployment...`
          )
          setIsDeclaring(false)
          setDeclStatus('done')
          remixClient.emit('statusChanged', {
            key: 'succeed',
            type: 'success',
            title: `Contract ${selectedContract?.name ?? ''} declared!`
          })
        } catch (error) {
          const declareResponse = await account.declare({
            contract: selectedContract.sierra,
            classHash: selectedContract.classHash,
            compiledClassHash: selectedContract.compiledClassHash
          })
          await remixClient.call('terminal', 'log', {
            value: JSON.stringify(declareResponse, null, 2),
            type: 'info'
          })
          updatedTransactions = [
            {
              type: 'declare',
              account,
              provider,
              txId: declareResponse.transaction_hash,
              env
            },
            ...updatedTransactions
          ]
          setTransactions(updatedTransactions)
          setDeclTxHash(declareResponse.transaction_hash)
        }
        setContractDeclaration(selectedContract)
      } catch (error) {
        setDeclStatus('error')
        setIsDeclaring(false)
        if (error instanceof Error) {
          await remixClient.call('terminal', 'log', {
            value: error.message,
            type: 'error'
          })
          throw new Error(
            error.message +
              "\n Aborting deployment... Couldn't get declare infomation"
          )
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        await remixClient.call('terminal', 'log', {
          value: error.message,
          type: 'error'
        })
      }
      remixClient.emit('statusChanged', {
        key: 'failed',
        type: 'error',
        title: 'Declaration failed, error logged in the terminal!'
      })
    }
  }

  const deploy = async (calldata: BigNumberish[]): Promise<void> => {
    setIsDeploying(true)
    remixClient.emit('statusChanged', {
      key: 'loading',
      type: 'info',
      title: `Deploying ${selectedContract?.name ?? ''} ...`
    })
    const classHash = selectedContract?.classHash
    const updatedTransactions = transactions
    try {
      if (account === null || provider === null) {
        throw new Error('No account or provider selected!')
      }

      if (selectedContract === null) {
        throw new Error('No contract selected for deployment!')
      }

      setDeployStatus('Deploying...')

      const deployResponse = await account.deployContract({
        classHash: classHash ?? selectedContract.classHash,
        constructorCalldata: calldata
      })
      await remixClient.call('terminal', 'log', {
        value: JSON.stringify(deployResponse, null, 2),
        type: 'info'
      })

      setTransactions([
        {
          type: 'deploy',
          account,
          provider,
          txId: deployResponse.transaction_hash,
          env
        },
        ...updatedTransactions
      ])
      setDeployTxHash(deployResponse.transaction_hash)
      setContractDeployment(selectedContract, deployResponse.contract_address)
      // setContractAsDeployed(selectedContract as Contract);
    } catch (error) {
      setDeployStatus('error')
      setIsDeploying(false)
      if (error instanceof Error) {
        await remixClient.call('terminal', 'log', {
          value: error.message,
          type: 'error'
        })
      }
      remixClient.emit('statusChanged', {
        key: 'failed',
        type: 'error',
        title: 'Deployment failed, error logged in the terminal!'
      })
    }
  }

  const handleDeploy = (calldata: BigNumberish[]): void => {
    deploy(calldata).catch((error) => {
      console.log('Error during deployment:', error)
    })
  }

  const handleDeploySubmit = (event: any): void => {
    event.preventDefault()
    const formDataValues = Object.values(constructorCalldata)
    if (
      formDataValues.length < constructorInputs.length ||
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      formDataValues.some((input) => !input.value)
    ) {
      setNotEnoughInputs(true)
    } else {
      setNotEnoughInputs(false)
      const calldata = getFormattedCalldata()
      // setFinalCallData(calldata)
      handleDeploy(calldata)
    }
  }

  const handleDeclare = (event: any): void => {
    event.preventDefault()
    declare().catch((error) => {
      console.log('Error during declaration:', error)
    })
  }

  const handleConstructorCalldataChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    event.preventDefault()
    const {
      name,
      value,
      dataset: { type, index }
    } = event.target
    if (index != null) {
      setConstructorCalldata((prevCalldata) => ({
        ...prevCalldata,
        [index]: {
          name,
          value,
          type
        }
      }))
    }
  }

  const getFormattedCalldata = (): BigNumberish[] => {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (constructorCalldata) {
      const formattedCalldata: CallDataObj[] = []

      Object.values(constructorCalldata).forEach((input) => {
        formattedCalldata.push(
          input.value
            .trim()
            .split(',')
            .map((val) => val.trim()) as CallDataObj
        )
      })

      return formattedCalldata.flat() as BigNumberish[]
    }
    return []
  }

  const setContractDeclaration = (currentContract: Contract): void => {
    if (account == null) return
    const declaredContract = {
      ...currentContract,
      declaredInfo: [
        ...currentContract.declaredInfo,
        { chainId }
      ]
    }
    const updatedContracts = contracts.map((contract) => {
      if (contract.classHash === declaredContract.classHash) {
        return declaredContract
      }
      return contract
    })
    setContracts(updatedContracts)
    setSelectedContract(declaredContract)
  }

  const setContractDeployment = (
    currentContract: Contract,
    address: string
  ): void => {
    if (account == null) return
    const deployedContract = {
      ...currentContract,
      address,
      deployedInfo: [
        ...currentContract.deployedInfo,
        { address: account.address, chainId }
      ]
    }
    const updatedContracts = contracts.map((contract) => {
      if (contract.classHash === deployedContract.classHash) {
        return deployedContract
      }
      return contract
    })
    setContracts(updatedContracts)
    setSelectedContract(deployedContract)
  }

  return (
    <>
      <Container>
        {contracts.length > 0 && selectedContract != null
          ? (
          <div className="">
            <CompiledContracts show={'class'} />
            <button
                className="btn btn-warning btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3 px-0"
                style={{
                  cursor: `${
                    isDeclaring ||
                    account == null ||
                    selectedContract.declaredInfo.some(
                      (info) =>
                        info.chainId === chainId
                    )
                      ? 'not-allowed'
                      : 'pointer'
                  }`
                }}
                disabled={
                  isDeclaring ||
                  account == null ||
                  selectedContract.declaredInfo.some(
                    (info) =>
                      info.chainId === chainId
                  )
                }
                aria-disabled={
                  isDeclaring ||
                  account == null ||
                  selectedContract.declaredInfo.some(
                    (info) =>
                      info.chainId === chainId
                  )
                }
                onClick={handleDeclare}
              >
                <div className="d-flex align-items-center justify-content-center">
                  <div className="text-truncate overflow-hidden text-nowrap">
                    {isDeclaring
                      ? (
                      <>
                        <span style={{ paddingLeft: '0.5rem' }}>
                          {declStatus}
                        </span>
                      </>
                        )
                      : (
                      <div className="text-truncate overflow-hidden text-nowrap">
                        {account !== null &&
                        selectedContract.declaredInfo.some(
                          (info) =>
                            info.chainId === chainId
                        )
                          ? (
                          <span>
                            {' '}
                            Declared {selectedContract.name} <i className="bi bi-check"></i>
                          </span>
                            )
                          : (
                          <span> Declare {selectedContract.name}</span>
                            )}
                      </div>
                        )}
                  </div>
                </div>
              </button>
            <form onSubmit={handleDeploySubmit}>
              {constructorInputs.map((input, index) => {
                return (
                  <div
                    className="udapp_multiArg constructor-label-wrapper"
                    key={index}
                  >
                    <label key={index} className="constructor-label">
                      {`${input.name} (${
                        getParameterType(input.type) ?? ''
                      }): `}
                      { getParameterType(input.type) === 'u256 (low, high)' && <Tooltip content = 'for eg. input: `1, 0` corresponds to 1 (low: 1, high: 0) ' icon={<FaInfoCircle/> } /> }
                    </label>
                    <input
                      className="form-control constructor-input"
                      name={input.name}
                      data-type={input.type}
                      data-index={index}
                      value={constructorCalldata[index]?.value ?? ''}
                      onChange={handleConstructorCalldataChange}
                    />
                  </div>
                )
              })}
              <button
                className="btn btn-information btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3 px-0"
                style={{
                  cursor: `${
                    isDeploying ||
                    account == null ||
                    selectedContract.deployedInfo.some(
                      (info) =>
                        info.address === account.address &&
                        info.chainId === chainId
                    )
                      ? 'not-allowed'
                      : 'pointer'
                  }`
                }}
                disabled={
                  isDeploying ||
                  account == null ||
                  selectedContract.deployedInfo.some(
                    (info) =>
                      info.address === account.address &&
                      info.chainId === chainId
                  )
                }
                aria-disabled={
                  isDeploying ||
                  account == null ||
                  selectedContract.deployedInfo.some(
                    (info) =>
                      info.address === account.address &&
                      info.chainId === chainId
                  )
                }
                type="submit"
              >
                <div className="d-flex align-items-center justify-content-center">
                  <div className="text-truncate overflow-hidden text-nowrap">
                    {isDeploying
                      ? (
                      <>
                        <span style={{ paddingLeft: '0.5rem' }}>
                          {deployStatus}
                        </span>
                      </>
                        )
                      : (
                      <div className="text-truncate overflow-hidden text-nowrap">
                        {account != null &&
                        selectedContract.deployedInfo.some(
                          (info) =>
                            info.address === account.address &&
                            info.chainId === chainId
                        )
                          ? (
                          <span>
                            {' '}
                            Deployed <i className="bi bi-check"></i>{' '}
                            {selectedContract.name}
                          </span>
                            )
                          : (
                          <span> Deploy {selectedContract.name}</span>
                            )}
                      </div>
                        )}
                  </div>
                </div>
              </button>
            </form>
            {account != null &&
              selectedContract.deployedInfo.some(
                (info) =>
                  info.address === account.address && info.chainId === chainId
              ) && (
                <div className="mt-3">
                  <label style={{ display: 'block' }}>
                    Contract deployed! See{' '}
                    <a
                      href="/"
                      className="text-info"
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveTab('interaction')
                      }}
                    >
                      Interact
                    </a>{' '}
                    for more!
                  </label>
                </div>
            )}
            {notEnoughInputs && (
              <label>Please fill out all constructor fields!</label>
            )}
          </div>
            )
          : (
          <p>No contracts ready for deployment yet, compile a cairo contract</p>
            )}
      </Container>
    </>
  )
}

export default Deployment
