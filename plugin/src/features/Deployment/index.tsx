import React, { useEffect, useState } from 'react'

import { type BigNumberish } from 'ethers'
import CompiledContracts from '../../components/CompiledContracts'
import {
  type CallDataObj,
  type CallDataObject,
  type Contract
} from '../../utils/types/contracts'
import { getConstructor, getParameterType } from '../../utils/utils'
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
import useAccount from '../../hooks/useAccount'
import useProvider from '../../hooks/useProvider'
import useRemixClient from '../../hooks/useRemixClient'
import { Modal } from 'react-bootstrap'
import { FELT } from '../../utils/types'
import { fetchClass, fetchAddress } from '../../utils/fetchContract'
import {
  constructorInputsAtom,
  deployStatusAtom,
  deploymentAtom,
  isDeployingAtom,
  notEnoughInputsAtom
} from '../../atoms/deployment'
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

  const { isDeploying, deployStatus, constructorInputs, notEnoughInputs } =
    useAtomValue(deploymentAtom)

  const setIsDeploying = useSetAtom(isDeployingAtom)
  const setDeployStatus = useSetAtom(deployStatusAtom)
  const setConstructorInputs = useSetAtom(constructorInputsAtom)
  const setNotEnoughInputs = useSetAtom(notEnoughInputsAtom)

  const [transactions, setTransactions] = useAtom(transactionsAtom)
  const env = useAtomValue(envAtom)

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

  const deploy = async (calldata: BigNumberish[]): Promise<void> => {
    setIsDeploying(true)
    remixClient.emit('statusChanged', {
      key: 'loading',
      type: 'info',
      title: `Deploying ${selectedContract?.name ?? ''} ...`
    })
    let classHash = selectedContract?.sierraClassHash
    let updatedTransactions = transactions
    try {
      if (account === null || provider === null) {
        throw new Error('No account or provider selected!')
      }

      if (selectedContract === null) {
        throw new Error('No contract selected for deployment!')
      }

      setDeployStatus('Declaring...')
      try {
        try {
          const classData = await fetchClass(selectedContract.sierraClassHash)
          // handle class data
            'notification' as any,
            'toast',
            `ℹ️ Contract with classHash: ${selectedContract.sierraClassHash} already has been declared, proceeding to deployment...`
          )
        } catch (error) {
          const declareResponse = await account.declare({
            contract: selectedContract.sierra,
            classHash: selectedContract.sierraClassHash,
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
          classHash = declareResponse.class_hash
          await account.waitForTransaction(declareResponse.transaction_hash)
        }
      } catch (error) {
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
      await account.waitForTransaction(deployResponse.transaction_hash)
      setDeployStatus('done')
      setActiveTab('interaction')
      setContractDeployment(selectedContract, deployResponse.contract_address)
      remixClient.emit('statusChanged', {
        key: 'succeed',
        type: 'success',
        title: `Contract ${selectedContract?.name} deployed!`
      })
      // setContractAsDeployed(selectedContract as Contract);
    } catch (error) {
      setDeployStatus('error')
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
    setIsDeploying(false)
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
        {contracts.length > 0 && selectedContract != null ? (
          <div className="">
            <CompiledContracts show={'class'} />
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
                className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3 px-0"
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
                    {isDeploying ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        >
                          {' '}
                        </span>
                        <span style={{ paddingLeft: '0.5rem' }}>
                          {deployStatus}
                        </span>
                      </>
                    ) : (
                      <div className="text-truncate overflow-hidden text-nowrap">
                        {account != null &&
                        selectedContract.deployedInfo.some(
                          (info) =>
                            info.address === account.address &&
                            info.chainId === chainId
                        ) ? (
                          <span>
                            {' '}
                            Deployed <i className="bi bi-check"></i>{' '}
                            {selectedContract.name}
                          </span>
                        ) : (
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
        ) : (
          <p>No contracts ready for deployment yet, compile a cairo contract</p>
        )}
      </Container>
    </>
  )
  const [showModal, setShowModal] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  const handleInputSubmit = async () => {
    const isClassHash = FELT.test(inputValue)
    if (isClassHash) {
      const classData = await fetchClass(inputValue)
      // handle class data
    } else {
      const classHash = await fetchAddress(inputValue)
      const classData = await fetchClass(classHash)
      // handle class data
    } else {
      const classHash = await getClassHashAt(inputValue)
      const classData = await getClassByHash(classHash)
      // handle class data
    }
    handleCloseModal()
  }

  return (
    <>
      <Container>
        <button onClick={handleOpenModal}>+</button>
        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Enter Class Hash or Contract Address</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
            />
          </Modal.Body>
          <Modal.Footer>
            <button onClick={handleInputSubmit}>Submit</button>
          </Modal.Footer>
        </Modal>
        {contracts.length > 0 && selectedContract != null ? (
          <div className="">
            <CompiledContracts show={'class'} />
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
                className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3 px-0"
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
                    {isDeploying ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        >
                          {' '}
                        </span>
                        <span style={{ paddingLeft: '0.5rem' }}>
                          {deployStatus}
                        </span>
                      </>
                    ) : (
                      <div className="text-truncate overflow-hidden text-nowrap">
                        {account != null &&
                        selectedContract.deployedInfo.some(
                          (info) =>
                            info.address === account.address &&
                            info.chainId === chainId
                        ) ? (
                          <span>
                            {' '}
                            Deployed <i className="bi bi-check"></i>{' '}
                            {selectedContract.name}
                          </span>
                        ) : (
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
        ) : (
          <p>No contracts ready for deployment yet, compile a cairo contract</p>
        )}
      </Container>
    </>
  )
}

export default Deployment
