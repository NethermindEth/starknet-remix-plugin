import React, { useEffect, useState } from 'react'

import { type BigNumberish } from 'ethers'
import CompiledContracts from '../../components/CompiledContracts'
import {
  type Contract
} from '../../utils/types/contracts'
import { getConstructor, getShortenedHash } from '../../utils/utils'
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
import {
  constructorInputsAtom,
  deployStatusAtom,
  deploymentAtom,
  isDeployingAtom
} from '../../atoms/deployment'

import { type CallbackReturnType, ConstructorForm } from 'starknet-abi-forms'
import { useIcon } from '../../hooks/useIcons'
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

  const { notEnoughInputs } =
    useAtomValue(deploymentAtom)

  const setIsDeploying = useSetAtom(isDeployingAtom)
  const setDeployStatus = useSetAtom(deployStatusAtom)
  const setConstructorInputs = useSetAtom(constructorInputsAtom)

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
    let classHash = selectedContract?.classHash
    let updatedTransactions = transactions
    try {
      if (account === null || provider === null) {
        throw new Error('No account or provider selected!')
      }

      if (selectedContract === null) {
        throw new Error('No contract selected for deployment!')
      }
      console.log(provider)
      setDeployStatus('Declaring...')
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
        } catch (error) {
          await remixClient.call('terminal', 'log', {
            value: `------------------------ Declaring contract: ${selectedContract.name} ------------------------`,
            type: 'info'
          })
          const declareResponse = await account.declare({
            contract: selectedContract.sierra,
            classHash: selectedContract.classHash,
            compiledClassHash: selectedContract.compiledClassHash
          })
          await remixClient.call('terminal', 'log', {
            value: JSON.stringify(declareResponse, null, 2),
            type: 'info'
          })
          await remixClient.call('terminal', 'log', {
            value: `---------------------- End Declaring contract: ${selectedContract.name} ----------------------`,
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
          await remixClient.call('terminal', 'log', {
            value: `--------------------- Getting declare contract: ${selectedContract.name} tx receipt --------------------`,
            type: 'info'
          })
          const txReceipt = await account.waitForTransaction(declareResponse.transaction_hash)
          await remixClient.call('terminal', 'log', {
            value: JSON.stringify(txReceipt, null, 2),
            type: 'info'
          })
          await remixClient.call('terminal', 'log', {
            value: `--------------------- End getting declare contract: ${selectedContract.name} tx receipt ------------------`,
            type: 'info'
          })
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

      await remixClient.call('terminal', 'log', {
        value: `------------------------ Deploying contract: ${selectedContract.name} ------------------------`,
        type: 'info'
      })

      const deployResponse = await account.deploy({
        classHash: classHash ?? selectedContract.classHash,
        constructorCalldata: calldata
      })

      await remixClient.call('terminal', 'log', {
        value: JSON.stringify(deployResponse, null, 2),
        type: 'info'
      })

      await remixClient.call('terminal', 'log', {
        value: `---------------------- End Deploying contract: ${selectedContract.name} ----------------------`,
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

      await remixClient.call('terminal', 'log', {
        value: `--------------------- Getting deploy contract: ${selectedContract.name} tx receipt --------------------`,
        type: 'info'
      })

      const txReceipt = await account.waitForTransaction(deployResponse.transaction_hash)
      await remixClient.call('terminal', 'log', {
        value: JSON.stringify(txReceipt, null, 2),
        type: 'info'
      })

      await remixClient.call('terminal', 'log', {
        value: `--------------------- End getting deploy contract: ${selectedContract.name} tx receipt ------------------`,
        type: 'info'
      })

      setDeployStatus('done')
      setActiveTab('interaction')
      setContractDeployment(selectedContract, deployResponse.contract_address[0])
      remixClient.emit('statusChanged', {
        key: 'succeed',
        type: 'success',
        title: `Contract ${selectedContract?.name} deployed!`
      })
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

  const handleDeploySubmit = (data: CallbackReturnType): void => {
    handleDeploy(data.starknetjs as BigNumberish[])
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
            <div className={'compilation-info flex-col text-center align-items-center mb-2'}>
              <div className={'icon'}>
                <img src={useIcon('deploy-icon.svg')} alt={'deploy-icon'}/>
              </div>
              <span className={'mt-1 mb-1'}>Deploy your selected contract</span>
            </div>
            <CompiledContracts show={'class'} />
            <ConstructorForm key = {selectedContract.compiledClassHash + selectedContract.sierraClassHash} abi={selectedContract.abi} callBackFn={handleDeploySubmit} />
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
              <div className={'flex flex-column justify-content-center align-items-center'}>
                <div className={'icon mb-2'}>
                  <img src={useIcon('deploy-icon.svg')} alt={'deploy-icon'}/>
                </div>
                <p>No contracts ready for deployment yet, compile a cairo contract</p>
              </div>
            )}
      </Container>
    </>
  )
}

export default Deployment
