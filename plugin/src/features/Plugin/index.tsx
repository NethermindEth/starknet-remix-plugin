import React, { useEffect, useState } from 'react'

import { Environment } from '../Environment'
import './styles.css'

import Compilation from '../Compilation'
import Deployment from '../Deployment'
import Interaction from '../Interaction'
import Accordian, {
  AccordianItem,
  AccordionContent,
  AccordionTrigger
} from '../../components/ui_components/Accordian'
import TransactionHistory from '../TransactionHistory'
import Footer from '../Footer'
import StateAction from '../../components/StateAction'
import BackgroundNotices from '../../components/BackgroundNotices'
import {
  useCurrentExplorer
} from '../../components/ExplorerSelector'
import { useAtomValue, useSetAtom, useAtom } from 'jotai'
import { isCompilingAtom, statusAtom } from '../../atoms/compilation'
import { deploymentAtom } from '../../atoms/deployment'
import { pluginLoaded as atomPluginLoaded } from '../../atoms/remixClient'
import useRemixClient from '../../hooks/useRemixClient'
import { fetchGitHubFilesRecursively } from '../../utils/initial_scarb_codes'
import * as Tabs from '@radix-ui/react-tabs'
import { Settings } from '../../components/Settings'
import { versionsAtom, cairoVersionAtom } from '../../atoms/cairoVersion'
import { apiUrl } from '../../utils/network'
import { StarknetProvider } from '../../components/starknet/starknet-provider'
export type AccordianTabs =
  | 'compile'
  | 'deploy'
  | 'interaction'
  | 'transactions'
  | ''

const Plugin: React.FC = () => {
  const isCompiling = useAtomValue(isCompilingAtom)
  const status = useAtomValue(statusAtom)

  const {
    isDeploying,
    deployStatus
  } = useAtomValue(deploymentAtom)

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

  const setCairoVersion = useSetAtom(cairoVersionAtom)
  const [getVersions, setVersions] = useAtom(versionsAtom)
  const { remixClient } = useRemixClient()

  const envViteVersion: string | undefined = import.meta.env.VITE_VERSION
  const pluginVersion = envViteVersion !== undefined ? `v${envViteVersion}` : 'v0.2.5'

  useEffect(() => {
    const fetchCairoVersions = async (): Promise<void> => {
      try {
        if (apiUrl !== undefined) {
          const response = await fetch(
              `${apiUrl}/cairo_versions`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/octet-stream'
                },
                redirect: 'follow'
              }
          )
          const versions = JSON.parse(await response.text())
          versions.sort()
          setVersions(versions)
        }
      } catch (e) {
        await remixClient.call('notification' as any, 'toast', '🔴 Failed to fetch cairo versions from the compilation server')
        console.error(e)
        await remixClient.terminal.log(`🔴 Failed to fetch cairo versions from the compilation server ${e as string}` as any)
      }
    }

    setTimeout(() => {
      const fetchCairo = async (): Promise<void> => {
        await fetchCairoVersions()

        if (getVersions.length > 0) {
          setCairoVersion(getVersions[getVersions.length - 1])
        }
      }
      fetchCairo().catch(e => { console.error(e) })
    }, 10000)
  }, [remixClient])

  useEffect(() => {
    if (getVersions.length > 0) {
      setCairoVersion(getVersions[getVersions.length - 1])
    }
  }, [remixClient, getVersions])

  const explorerHook = useCurrentExplorer()

  const setPluginLoaded = useSetAtom(atomPluginLoaded)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const id = setTimeout(async (): Promise<void> => {
      await remixClient.onload(() => {
        setPluginLoaded(true)
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setTimeout(async () => {
          const workspaces = await remixClient.filePanel.getWorkspaces()

          const workspaceLets: Array<{ name: string, isGitRepo: boolean }> =
                        JSON.parse(JSON.stringify(workspaces))

          if (
            !workspaceLets.some(
              (workspaceLet) => workspaceLet.name === 'cairo_scarb_sample'
            )
          ) {
            await remixClient.filePanel.createWorkspace(
              'cairo_scarb_sample',
              true
            )
            try {
              await remixClient.fileManager.mkdir('hello_world')
            } catch (e) {
              console.log(e)
            }
            const exampleRepo = await fetchGitHubFilesRecursively(
              'software-mansion/scarb',
              'examples/starknet_multiple_contracts'
            )

            console.log('exampleRepo', exampleRepo)

            try {
              for (const file of exampleRepo) {
                const filePath = file?.path
                  .replace('examples/starknet_multiple_contracts/', '')
                  .replace('examples/starknet_multiple_contracts', '') ?? ''

                let fileContent: string = file?.content ?? ''

                if (file != null && file.fileName === 'Scarb.toml') {
                  fileContent = fileContent.concat('\ncasm = true')
                }

                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                await remixClient.fileManager.writeFile(
                                    `hello_world/${
                                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                                    filePath
                                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                                    }/${file?.fileName}`,
                                    fileContent
                )
              }
            } catch (e) {
              if (e instanceof Error) {
                await remixClient.call('notification' as any, 'alert', {
                  id: 'starknetRemixPluginAlert',
                  title: 'Please check the write file permission',
                  message: e.message + '\n' + 'Did you provide the write file permission?'
                })
              }
              console.log(e)
            }
          }
        })
      })
    }, 1)
    return () => {
      clearInterval(id)
    }
  }, [])

  return (
    <StarknetProvider>
      <div className='plugin-wrapper'>
        <div className='plugin-main-wrapper'>
          <div className={'plugin-version-wrapper'}>
            <div className={'plugin-version-label'}>
              ALPHA
            </div>
            <div className={'plugin-version'}>
              Using {pluginVersion}
            </div>
          </div>
          <div>
            <Environment />
          </div>

          <Tabs.Root defaultValue={'home'}>
            {/* <Tabs.List> */}
            {/*  <Tabs.Trigger value='home'>Home</Tabs.Trigger> */}
            {/*  <Tabs.Trigger value='transactions'>Transactions</Tabs.Trigger> */}
            {/*  <Tabs.Trigger value='info'>Info</Tabs.Trigger> */}
            {/* </Tabs.List> */}

            {/* apply styles */}
            <Tabs.List className={'flex justify-between rounded tab-list'}>
              <div className={'tabs-trigger'}></div>
              <Tabs.Trigger value={'home'} className={'tabs-trigger'}>Home</Tabs.Trigger>
              <Tabs.Trigger value={'transactions'} className={'tabs-trigger'}>Transactions</Tabs.Trigger>
              <Tabs.Trigger value={'info'} className={'tabs-trigger'}>Info</Tabs.Trigger>
              <Tabs.Trigger value={'settings'} className={'tabs-trigger'}>Settings</Tabs.Trigger>
              <div className={'tabs-trigger'}></div>
            </Tabs.List>

            <Tabs.Content value='home'>
              <Accordian
                  type='single'
                  value={currentAccordian}
                  defaultValue={'compile'}
              >
                <AccordianItem value='compile'>
                  <AccordionTrigger
                      onClick={() => {
                        handleTabView('compile')
                      }}
                  >
                  <span
                      className='d-flex align-items-center'
                      style={{ gap: '0.5rem' }}
                  >
                    <span className={'accordian-list-number'}>1</span>
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

                <AccordianItem value='deploy'>
                  <AccordionTrigger
                      onClick={() => {
                        handleTabView('deploy')
                      }}
                  >
                  <span
                      className='d-flex align-items-center'
                      style={{ gap: '0.5rem' }}
                  >
                    <span className={'accordian-list-number'}>2</span>
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
                <AccordianItem value='interaction'>
                  <AccordionTrigger
                      onClick={() => {
                        handleTabView('interaction')
                      }}
                    >
                    <span
                        className='d-flex align-items-center'
                        style={{ gap: '0.5rem' }}
                    >
                      <span className={'accordian-list-number'}>3</span>
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
                </Accordian>
              </Tabs.Content>

              <Tabs.Content value='transactions'>
                <TransactionHistory controlHook={explorerHook} />
              </Tabs.Content>

              <Tabs.Content value='info'>
                <BackgroundNotices />
              </Tabs.Content>

              <Tabs.Content value={'settings'}>
                <Settings />
              </Tabs.Content>
            </Tabs.Root>
            <div className={'blank-placeholder'}></div>
          </div>
          <Footer />
      </div>
    </StarknetProvider>
  )
}

export default Plugin
