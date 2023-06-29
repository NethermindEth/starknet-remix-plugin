import React, { useState } from 'react'
import { CompiledContractsContext } from '../../contexts/CompiledContractsContext'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import {
  type CallDataObject,
  type Input,
  type Contract
} from '../../types/contracts'
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
} from '../../ui_components/Accordian'
import TransactionHistory from '../TransactionHistory'
import CairoVersion from '../CairoVersion'
import CompilationContext from '../../contexts/CompilationContext'
import DeploymentContext from '../../contexts/DeploymentContext'
import { type Devnet, devnets, type DevnetAccount } from '../../utils/network'
import { type StarknetWindowObject } from 'get-starknet'
import EnvironmentContext from '../../contexts/EnvironmentContext'
import { type Transaction } from '../../types/transaction'
import TransactionContext from '../../contexts/TransactionContext'

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

  // Deployment Context state variables
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState('')
  const [constructorCalldata, setConstructorCalldata] =
    useState<CallDataObject>({})
  const [constructorInputs, setConstructorInputs] = useState<Input[]>([])
  const [notEnoughInputs, setNotEnoughInputs] = useState(false)

  // Environment Context state variables
  const [devnet, setDevnet] = useState<Devnet>(devnets[0])
  const [env, setEnv] = useState<string>('devnet')
  const [isDevnetAlive, setIsDevnetAlive] = useState<boolean>(true)
  const [starknetWindowObject, setStarknetWindowObject] =
    useState<StarknetWindowObject | null>(null)
  const [selectedDevnetAccount, setSelectedDevnetAccount] =
    useState<DevnetAccount | null>(null)

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

  const [currentAccordian, setCurrentAccordian] =
    useState<AccordianTabs>('compile')

  const handleTabView = (clicked: AccordianTabs) => {
    if (currentAccordian === clicked) {
      setCurrentAccordian('')
    } else {
      setCurrentAccordian(clicked)
    }
  }

  return (
    // add a button for selecting the cairo version
    <>
      <div className="plugin-wrapper">
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
            <TransactionContext.Provider
              value={{
                transactions,
                setTransactions
              }}
            >
              <div>
                <CairoVersion />
                <Accordian
                  type="single"
                  value={currentAccordian}
                  defaultValue={'compile'}
                >
                  <AccordianItem value="compile">
                    <AccordionTrigger
                      onClick={() => {
                        handleTabView('compile')
                      }}
                    >
                      Compile
                    </AccordionTrigger>
                    <AccordionContent>
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
                          setHashDir
                        }}
                      >
                        <Compilation />
                      </CompilationContext.Provider>
                    </AccordionContent>
                  </AccordianItem>
                  <AccordianItem value="deploy">
                    <AccordionTrigger
                      onClick={() => {
                        handleTabView('deploy')
                      }}
                    >
                      Deploy
                    </AccordionTrigger>
                    <AccordionContent>
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
                        <Deployment setActiveTab={setCurrentAccordian} />
                      </DeploymentContext.Provider>
                    </AccordionContent>
                  </AccordianItem>
                  <AccordianItem value="interaction">
                    <AccordionTrigger
                      onClick={() => {
                        handleTabView('interaction')
                      }}
                    >
                      Interact
                    </AccordionTrigger>
                    <AccordionContent>
                      <Interaction />
                    </AccordionContent>
                  </AccordianItem>
                  <AccordianItem value="transactions">
                    <AccordionTrigger
                      onClick={() => {
                        handleTabView('transactions')
                      }}
                    >
                      Transactions
                    </AccordionTrigger>
                    <AccordionContent>
                      <TransactionHistory />
                    </AccordionContent>
                  </AccordianItem>
                </Accordian>
              </div>
              <div>
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
                    setSelectedDevnetAccount
                  }}
                >
                  <Environment />
                </EnvironmentContext.Provider>
              </div>
            </TransactionContext.Provider>
          </ConnectionContext.Provider>
        </CompiledContractsContext.Provider>
      </div>
    </>
  )
}

export default Plugin
