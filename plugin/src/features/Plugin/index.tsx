import React, { useState } from 'react'
import { CompiledContractsContext } from '../../contexts/CompiledContractsContext'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import { type Contract } from '../../types/contracts'
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

export type AccordianTabs =
  | 'compile'
  | 'deploy'
  | 'interaction'
  | 'transactions'

const Plugin: React.FC = () => {
  // START: CAIRO CONTRACTS
  // Store a list of compiled contracts
  const [compiledContracts, setCompiledContracts] = useState<Contract[]>([])
  // Store the current contract for UX purposes
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  )
  // END: CAIRO CONTRACTS

  // START: ACCOUNT, NETWORK, PROVIDER
  // Store connected wallet, account and provider
  const [provider, setProvider] = useState<Provider | ProviderInterface | null>(
    null
  )
  const [account, setAccount] = useState<Account | AccountInterface | null>(
    null
  )
  // END: ACCOUNT, NETWORK, PROVIDER

  const [currentAccordian, setCurrentAccordian] =
    useState<AccordianTabs>('compile')

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
          <div>
            <CompiledContractsContext.Provider
              value={{
                contracts: compiledContracts,
                setContracts: setCompiledContracts,
                selectedContract,
                setSelectedContract
              }}
            >
              <CairoVersion />
              <Accordian
                type="single"
                value={currentAccordian}
                defaultValue={'compile'}
              >
                <AccordianItem value="compile">
                  <AccordionTrigger
                    onClick={() => {
                      setCurrentAccordian('compile')
                    }}
                  >
                    Compile
                  </AccordionTrigger>
                  <AccordionContent>
                    <Compilation />
                  </AccordionContent>
                </AccordianItem>
                <AccordianItem value="deploy">
                  <AccordionTrigger
                    onClick={() => {
                      setCurrentAccordian('deploy')
                    }}
                  >
                    Deploy
                  </AccordionTrigger>
                  <AccordionContent>
                    <Deployment setActiveTab={setCurrentAccordian} />
                  </AccordionContent>
                </AccordianItem>
                <AccordianItem value="interaction">
                  <AccordionTrigger
                    onClick={() => {
                      setCurrentAccordian('interaction')
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
                      setCurrentAccordian('transactions')
                    }}
                  >
                    Transactions
                  </AccordionTrigger>
                  <AccordionContent>
                    <TransactionHistory />
                  </AccordionContent>
                </AccordianItem>
              </Accordian>
            </CompiledContractsContext.Provider>
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
