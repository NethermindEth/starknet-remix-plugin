import React, { useState } from 'react'
import { CompiledContractsContext } from '../../contexts/CompiledContractsContext'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import {
  type CallDataObject,
  type Input,
  type Contract
} from '../../utils/types/contracts'
import { Environment } from '../Environment'
import './styles.css'
import {
  type Account,
  type AccountInterface,
  type Provider,
  type ProviderInterface
} from 'starknet'
import Compilation from '../Compilation'
import Deployment from '../Deployment'
import Interaction from '../Interaction'
import Accordian, {
  AccordianItem,
  AccordionContent,
  AccordionTrigger
} from '../../components/ui_components/Accordian'
import TransactionHistory from '../TransactionHistory'
import CairoVersion from '../CairoVersion'
import CompilationContext from '../../contexts/CompilationContext'
import DeploymentContext from '../../contexts/DeploymentContext'
import { type Devnet, devnets, type DevnetAccount } from '../../utils/network'
import { type StarknetWindowObject } from 'get-starknet'
import EnvironmentContext from '../../contexts/EnvironmentContext'
import ManualAccountContext from '../../contexts/ManualAccountContext'
import { type Transaction } from '../../utils/types/transaction'
import TransactionContext from '../../contexts/TransactionContext'
import StateAction from '../../components/StateAction'
import type { ManualAccount } from '../../utils/types/accounts'
import { networks } from '../../utils/constants'
import BackgroundNotices from '../../components/BackgroundNotices'
import ExplorerSelector, {
  useCurrentExplorer
} from '../../components/ExplorerSelector'
import CairoVersionContext from '../../contexts/CairoVersion'
export type AccordianTabs =
  | 'compile'
  | 'deploy'
  | 'interaction'
  | 'transactions'
  | ''

const Plugin: React.FC = () => {
  // Compilation Context state variables
  const [status, setStatus] = useState('Compiling...')
  const [currentFilename, setCurrentFilename] = useState('')
  const [isCompiling, setIsCompiling] = useState(false)
  const [isValidCairo, setIsValidCairo] = useState(false)
  const [noFileSelected, setNoFileSelected] = useState(false)
  const [hashDir, setHashDir] = useState('')
  const [tomlPaths, setTomlPaths] = useState<string[]>([])
  const [activeTomlPath, setActiveTomlPath] = useState('')

  // Deployment Context state variables
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState('')
  const [constructorCalldata, setConstructorCalldata] =
    useState<CallDataObject>({})
  const [constructorInputs, setConstructorInputs] = useState<Input[]>([])
  const [notEnoughInputs, setNotEnoughInputs] = useState(false)

  // Environment Context state variables
  const [devnet, setDevnet] = useState<Devnet>(devnets[1])
  const [env, setEnv] = useState<string>('remoteDevnet')
  const [isDevnetAlive, setIsDevnetAlive] = useState<boolean>(true)
  const [starknetWindowObject, setStarknetWindowObject] =
    useState<StarknetWindowObject | null>(null)
  const [selectedDevnetAccount, setSelectedDevnetAccount] =
    useState<DevnetAccount | null>(null)
  const [availableDevnetAccounts, setAvailableDevnetAccounts] = useState<
  DevnetAccount[]
  >([])

  // Manual Account Context state variables
  const [accounts, setAccounts] = useState<ManualAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<ManualAccount | null>(
    null
  )
  const [networkName, setNetworkName] = useState<string>(networks[0].value)

  // Transaction History Context state variables
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Compilation Context state variables
  const [compiledContracts, setCompiledContracts] = useState<Contract[]>([])
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  )

  // Connection Context state variables
  const [provider, setProvider] = useState<Provider | ProviderInterface | null>(
    null
  )
  const [account, setAccount] = useState<Account | AccountInterface | null>(
    null
  )

  // Interaction state variables
  const [interactionStatus, setInteractionStatus] = useState<'loading' | 'success' | 'error' | ''>('')

  const [currentAccordian, setCurrentAccordian] =
    useState<AccordianTabs>('compile')

  const [cairoVersion, setCairoVersion] = useState<string>('version is loading...')

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const handleTabView = (clicked: AccordianTabs) => {
    if (currentAccordian === clicked) {
      setCurrentAccordian('')
    } else {
      setCurrentAccordian(clicked)
    }
  }

  const explorerHook = useCurrentExplorer()

  return (
    // add a button for selecting the cairo version
    <>
      <div className="plugin-wrapper">
        <EnvironmentContext.Provider
          value={{
            devnet,
            setDevnet,
            env,
            setEnv,
            isDevnetAlive,
            setIsDevnetAlive,
            starknetWindowObject,
            setStarknetWindowObject,
            selectedDevnetAccount,
            setSelectedDevnetAccount,
            availableDevnetAccounts,
            setAvailableDevnetAccounts
          }}
        >
          <CompiledContractsContext.Provider
            value={{
              contracts: compiledContracts,
              setContracts: setCompiledContracts,
              selectedContract,
              setSelectedContract
            }}
          >
            <ConnectionContext.Provider
              value={{
                provider,
                setProvider,
                account,
                setAccount
              }}
            >
              <CairoVersionContext.Provider value={
                  {
                    version: cairoVersion,
                    setVersion: setCairoVersion
                  }
              }>
                  <TransactionContext.Provider
                    value={{
                      transactions,
                      setTransactions
                    }}
                  >
                    <div className="plugin-main-wrapper">
                      <CairoVersion />
                      <Accordian
                        type="single"
                        value={currentAccordian}
                        defaultValue={'compile'}
                      >
                        <CompilationContext.Provider
                          value={{
                            status,
                            setStatus,
                            currentFilename,
                            setCurrentFilename,
                            isCompiling,
                            setIsCompiling,
                            isValidCairo,
                            setIsValidCairo,
                            noFileSelected,
                            setNoFileSelected,
                            hashDir,
                            setHashDir,
                            tomlPaths,
                            setTomlPaths,
                            activeTomlPath,
                            setActiveTomlPath
                          }}
                        >
                          <AccordianItem value="compile">
                            <AccordionTrigger
                              onClick={() => {
                                handleTabView('compile')
                              }}
                            >
                              <span
                                className="d-flex align-items-center"
                                style={{ gap: '0.5rem' }}
                              >
                                <p style={{ all: 'unset' }}>Compile</p>
                                <StateAction
                                  value={
                                    isCompiling
                                      ? 'loading'
                                      : status === 'done'
                                        ? 'success'
                                        : status === 'failed' ? 'error' : ''
                                  }
                                />
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <Compilation setAccordian={setCurrentAccordian} />
                            </AccordionContent>
                          </AccordianItem>
                        </CompilationContext.Provider>
                        <DeploymentContext.Provider
                          value={{
                            isDeploying,
                            setIsDeploying,
                            deployStatus,
                            setDeployStatus,
                            constructorCalldata,
                            setConstructorCalldata,
                            constructorInputs,
                            setConstructorInputs,
                            notEnoughInputs,
                            setNotEnoughInputs
                          }}
                        >
                          <AccordianItem value="deploy">
                            <AccordionTrigger
                              onClick={() => {
                                handleTabView('deploy')
                              }}
                            >
                              <span
                                className="d-flex align-items-center"
                                style={{ gap: '0.5rem' }}
                              >
                                <p style={{ all: 'unset' }}>Deploy</p>
                                <StateAction
                                  value={
                                    isDeploying
                                      ? 'loading'
                                      : deployStatus === 'error'
                                        ? 'error'
                                        : deployStatus === 'done'
                                          ? 'success'
                                          : ''
                                  }
                                />
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <Deployment setActiveTab={setCurrentAccordian} />
                            </AccordionContent>
                          </AccordianItem>
                          <AccordianItem value="interaction">
                            <AccordionTrigger
                              onClick={() => {
                                handleTabView('interaction')
                              }}
                            >
                              <span
                                className="d-flex align-items-center"
                                style={{ gap: '0.5rem' }}
                              >
                                <p style={{ all: 'unset' }}>Interact</p>
                                <StateAction
                                  value={interactionStatus}
                                />
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <Interaction setInteractionStatus={setInteractionStatus} />
                            </AccordionContent>
                          </AccordianItem>
                        </DeploymentContext.Provider>
                        <AccordianItem value="transactions">
                          <AccordionTrigger
                            onClick={() => {
                              handleTabView('transactions')
                            }}
                          >
                            <span
                              className="d-flex align-items-center"
                              style={{ gap: '0.5rem' }}
                            >
                              <p style={{ all: 'unset' }}> Transactions</p>
                              <ExplorerSelector
                                path=""
                                isTextVisible={false}
                                controlHook={explorerHook}
                              />
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <TransactionHistory controlHook={explorerHook}/>
                          </AccordionContent>
                        </AccordianItem>
                      </Accordian>
                      <div className="mt-5">
                        <BackgroundNotices />
                      </div>
                    </div>
                    <div>
                      <ManualAccountContext.Provider
                        value={{
                          accounts,
                          setAccounts,
                          selectedAccount,
                          setSelectedAccount,
                          networkName,
                          setNetworkName
                        }}
                      >
                        <Environment />
                      </ManualAccountContext.Provider>
                    </div>
                  </TransactionContext.Provider>
                </CairoVersionContext.Provider>
            </ConnectionContext.Provider>
          </CompiledContractsContext.Provider>
        </EnvironmentContext.Provider>
      </div>
    </>
  )
}

export default Plugin
