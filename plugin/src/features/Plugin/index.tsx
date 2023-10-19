import React, { useState } from 'react'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import {
  type CallDataObject,
  type Input
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
import StateAction from '../../components/StateAction'
import BackgroundNotices from '../../components/BackgroundNotices'
import ExplorerSelector, {
  useCurrentExplorer
} from '../../components/ExplorerSelector'
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
        <ConnectionContext.Provider
          value={{
            provider,
            setProvider,
            account,
            setAccount
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
                  <TransactionHistory controlHook={explorerHook} />
                </AccordionContent>
              </AccordianItem>
            </Accordian>
            <div className="mt-5">
              <BackgroundNotices />
            </div>
          </div>
          <div>
            <Environment />
          </div>
        </ConnectionContext.Provider>
      </div>
    </>
  )
}

export default Plugin
