import React, { useContext, useEffect, useState } from 'react'

// import { useContractFactory, useDeploy } from "@starknet-react/core";
import { type BigNumberish } from 'ethers'
import { uint256 } from 'starknet'
import CompiledContracts from '../../components/CompiledContracts'
import { CompiledContractsContext } from '../../contexts/CompiledContractsContext'
import {
  type CallDataObject,
  type Contract,
  type Input
} from '../../types/contracts'
import { getConstructor, getParameterType } from '../../utils/utils'
import './styles.css'
import Container from '../../ui_components/Container'

import { ConnectionContext } from '../../contexts/ConnectionContext'
import { RemixClientContext } from '../../contexts/RemixClientContext'
import { type AccordianTabs } from '../Plugin'

interface DeploymentProps {
  setActiveTab: (tab: AccordianTabs) => void
}

const Deployment: React.FC<DeploymentProps> = ({ setActiveTab }) => {
  const remixClient = useContext(RemixClientContext)
  const { account, provider } = useContext(ConnectionContext)

  const [isDeploying, setIsDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState('')
  const [constructorCalldata, setConstructorCalldata] =
    useState<CallDataObject>({})
  const [constructorInputs, setConstructorInputs] = useState<Input[]>([])
  const [notEnoughInputs, setNotEnoughInputs] = useState(false)
  const { contracts, selectedContract, setContracts, setSelectedContract } =
    useContext(CompiledContractsContext)

  useEffect(() => {
    setConstructorCalldata({})
    if (selectedContract != null) {
      console.log('Constructor', getConstructor(selectedContract?.abi))
      setConstructorInputs(getConstructor(selectedContract?.abi)?.inputs ?? [])
    }
  }, [selectedContract])

  const deploy = async (calldata: BigNumberish[]): Promise<void> => {
    setIsDeploying(true)
    try {
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
        console.log('declare response', declareResponse)
      } catch (error) {
        if (error instanceof Error) {
          await remixClient.call('terminal', 'log', {
            value: error as any,
            type: 'error'
          })
          await remixClient.call('notification' as any, 'toast', `ℹ️ Contract with classHash: ${selectedContract.classHash} already has been declared, proceeding to deployment...`)
        }
      }

      const deployResponse = await account.deployContract(
        {
          classHash: selectedContract.classHash,
          constructorCalldata: calldata
        },
        { cairoVersion: '1' }
      )
      console.log('deploy response', deployResponse)
      console.log(deployResponse.contract_address)
      setContractDeployment(
        selectedContract,
        deployResponse.contract_address
      )
      // setContractAsDeployed(selectedContract as Contract);
      console.log(deployResponse)
    } catch (error) {
      console.log('got this error during deployment', error, typeof error)
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
    console.log('Calldata:', calldata)
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
      const formattedCalldata: BigNumberish[] = []

      Object.values(constructorCalldata).forEach((input) => {
        console.log('Input', input)
        // Check if Uint256 and use uint256.from() to convert to BN
        if ((input.type?.includes('u256')) ?? false) {
          const uint = uint256.bnToUint256(input.value)
          formattedCalldata.push(uint.low)
          formattedCalldata.push(uint.high)
        } else {
          formattedCalldata.push(input.value)
        }
      })

      return formattedCalldata
    }
    return []
  }

  const setContractDeployment = (
    currentContract: Contract,
    address: string
  ): void => {
    console.log('Setting contract deployment')
    console.log('Current contract:', currentContract)
    console.log('Address:', address)
    const deployedContract = {
      ...currentContract,
      address,
      deployed: true
    }
    console.log('Deployed contract:', deployedContract)
    const updatedContracts = contracts.map((contract) => {
      if (contract.classHash === deployedContract.classHash) {
        return deployedContract
      }
      return contract
    })
    setContracts(updatedContracts)
    setSelectedContract(deployedContract)
    console.log('Contract selected:', selectedContract)
    console.log('Contracts:', contracts)
  }

  return (
    <>
      <Container>
        {contracts.length > 0 && selectedContract != null
          ? (
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
                      {`${input.name} (${getParameterType(input.type) ?? ''}): `}
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
                  cursor: `${(account == null || selectedContract.deployed) ? 'not-allowed' : 'pointer'}`
                }}
                disabled={account == null || selectedContract.deployed}
                aria-disabled={account == null || selectedContract.deployed}
                type="submit"
              >
                <div className="d-flex align-items-center justify-content-center">
                  <div className="text-truncate overflow-hidden text-nowrap">
                    {isDeploying
                      ? (
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
                        )
                      : (
                      <div className="text-truncate overflow-hidden text-nowrap">
                        {selectedContract.deployed ? <span> Deployed  <i className="bi bi-check"></i> {selectedContract.name}</span> : <span> Deploy {selectedContract.name}</span> }
                      </div>
                        )}
                  </div>
                </div>
              </button>
            </form>
            {selectedContract.deployed && (
              <div className="mt-3">
                <label style={{ display: 'block' }}>Contract deployed!</label>
                <label style={{ display: 'block' }}>
                  See{' '}
                  <a
                    href="/"
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
