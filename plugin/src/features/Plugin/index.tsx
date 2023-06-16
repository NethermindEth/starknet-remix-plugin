import React, { useContext, useEffect, useState } from 'react'
import { CompiledContractsContext } from '../../contexts/CompiledContractsContext'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import { type Contract } from '../../types/contracts'
import { Environment } from '../Environment'
import './styles.css'

import { apiUrl } from '../../utils/network'
import {
  type Account,
  type AccountInterface,
  type Provider,
  type ProviderInterface
} from 'starknet'
import Compilation from '../Compilation'
import Deployment from '../Deployment'
import Interaction from '../Interaction'
import { RemixClientContext } from '../../contexts/RemixClientContext'
import Nethermind from '../../components/NM'
import * as D from '../../ui_components/Dropdown'
import { BsChevronDown } from 'react-icons/bs'
import Accordian, {
  AccordianItem,
  AccordionContent,
  AccordionTrigger
} from '../../ui_components/Accordian'
import TransactionHistory from '../TransactionHistory'

export type AccordianTabs =
  | 'compile'
  | 'deploy'
  | 'interaction'
  | 'transactions'

const Plugin: React.FC = () => {
  // START : Get Cairo version
  const [cairoVersion, setCairoVersion] = useState('no version')
  const remixClient = useContext(RemixClientContext)

  useEffect(() => {
    const id = setTimeout(async (): Promise<void> => {
      try {
        if (apiUrl !== undefined) {
          const response = await fetch(`${apiUrl}/cairo_version`, {
            method: 'GET',
            redirect: 'follow',
            headers: {
              'Content-Type': 'application/octet-stream'
            }
          })
          setCairoVersion(await response.text())
        }
      } catch (e) {
        remixClient.cancel('notification' as any, 'toast')
        await remixClient.call(
          'notification' as any,
          'toast',
          '🔴 Failed to fetch cairo version from the compilation server!'
        )
        console.error(e)
      }
    }, 100)
    return () => {
      clearInterval(id)
    }
  }, [remixClient])
  // END : Get Cairo version

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

  // Dummy Cairo Verison
  const [versions] = useState<string[]>([
    'cairo-lang-compiler 1.0.0-alpha.6',
    'cairo-lang-compiler 1.0.0-alpha.7',
    'cairo-lang-compiler 1.0.1'
  ])

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
              <div className="version-wrapper">
                <div>
                  <D.Root>
                    <D.Trigger>
                      <label className="cairo-version-legend">
                        Using {cairoVersion} <BsChevronDown />
                      </label>
                    </D.Trigger>
                    <D.Portal>
                      <D.Content>
                        {versions.map((v, i) => {
                          return (
                            <D.Item
                              key={i}
                              onClick={() => {
                                setCairoVersion(v)
                              }}
                            >
                              {v}
                            </D.Item>
                          )
                        })}
                      </D.Content>
                    </D.Portal>
                  </D.Root>
                </div>

                <label className="cairo-version-legend">
                  Powered by <Nethermind size="xs" />
                </label>
              </div>
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
