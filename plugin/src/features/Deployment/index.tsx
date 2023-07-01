import React, { useContext, useEffect, useState } from 'react'

import { type BigNumberish } from 'ethers'
import CompiledContracts from '../../components/CompiledContracts'
import { CompiledContractsContext } from '../../contexts/CompiledContractsContext'
import {
  type CallDataObj,
  type CallDataObject,
  type Contract
} from '../../types/contracts'
import { getConstructor, getParameterType } from '../../utils/utils'
import './styles.css'
import Container from '../../ui_components/Container'

import { ConnectionContext } from '../../contexts/ConnectionContext'
import { RemixClientContext } from '../../contexts/RemixClientContext'
import { type AccordianTabs } from '../Plugin'
import DeploymentContext from '../../contexts/DeploymentContext'
import TransactionContext from '../../contexts/TransactionContext'

interface DeploymentProps {
  setActiveTab: (tab: AccordianTabs) => void
}

const Deployment: React.FC<DeploymentProps> = ({ setActiveTab }) => {
  const remixClient = useContext(RemixClientContext)
  const { account, provider } = useContext(ConnectionContext)
  const { contracts, selectedContract, setContracts, setSelectedContract } =
    useContext(CompiledContractsContext)

  const [constructorCalldata, setConstructorCalldata] =
    useState<CallDataObject>({})

  const {
    isDeploying,
    setIsDeploying,
    deployStatus,
    setDeployStatus,
    constructorInputs,
    setConstructorInputs,
    notEnoughInputs,
    setNotEnoughInputs
  } = useContext(DeploymentContext)

  const { transactions, setTransactions } = useContext(TransactionContext)

  useEffect(() => {
    setConstructorCalldata({})
    if (selectedContract != null) {
      setConstructorInputs(getConstructor(selectedContract?.abi)?.inputs ?? [])
    }
  }, [selectedContract])

  const deploy = async (calldata: BigNumberish[]): Promise<void> => {
    setIsDeploying(true)
    try {
      if (account?.constructor.name === 'WrappedAccount') {
        await remixClient.call('notification' as any, 'alert', {
          id: 'wallet not supported',
          title: 'wallet does not support cairo1 deployment',
          message: 'Wallet accounts do not support cairo1 deployment!'
        })
        throw new Error('Wallet accounts do not support cairo1 deployment!')
      }
      if (account === null || provider === null) {
        throw new Error('No account or provider selected!')
      }

      if (selectedContract === null) {
        throw new Error('No contract selected for deployment!')
      }

      setDeployStatus('Declaring...')

      try {
        const declareResponse = await account.declare({
          contract: selectedContract.sierra,
          compiledClassHash: selectedContract.compiledClassHash
        })
        setTransactions([
          ...transactions,
          {
            type: 'declare',
            account,
            provider,
            txId: declareResponse.transaction_hash
          }
        ])
        await remixClient.call('terminal', 'log', {
          value: JSON.stringify(declareResponse, null, 2),
          type: 'info'
        })
      } catch (error) {
        if (error instanceof Error) {
          setDeployStatus('error')
          await remixClient.call('terminal', 'log', {
            value: error.message,
            type: 'error'
          })
          if (error.message.includes('is already declared'))
            await remixClient.call(
              'notification' as any,
              'toast',
              `ℹ️ Contract with classHash: ${selectedContract.classHash} already has been declared, proceeding to deployment...`
            )
        }
      }

      const deployResponse = await account.deployContract(
        {
          classHash: selectedContract.classHash,
          constructorCalldata: calldata
        },
        { cairoVersion: '1' }
      )

      setTransactions([
        ...transactions,
        {
          type: 'deploy',
          account,
          provider,
          txId: deployResponse.transaction_hash
        }
      ])

      await remixClient.call('terminal', 'log', {
        value: JSON.stringify(deployResponse, null, 2),
        type: 'info'
      })
      setDeployStatus('done')
      setContractDeployment(selectedContract, deployResponse.contract_address)
      // setContractAsDeployed(selectedContract as Contract);
    } catch (error) {
      setDeployStatus('error')
      if (error instanceof Error) {
        await remixClient.call('terminal', 'log', {
          value: error.message,
          type: 'error'
        })
      }
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
    setConstructorCalldata((prevCalldata) => ({
      ...prevCalldata,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      [index!]: {
        name,
        value,
        type
      }
    }))
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
    const deployedContract = {
      ...currentContract,
      address,
      deployed: true
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
            <CompiledContracts />
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
                    account == null || selectedContract.deployed
                      ? 'not-allowed'
                      : 'pointer'
                  }`
                }}
                disabled={account == null || selectedContract.deployed}
                aria-disabled={account == null || selectedContract.deployed}
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
                        {selectedContract.deployed ? (
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
            {selectedContract.deployed && (
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
