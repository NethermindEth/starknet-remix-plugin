/* eslint-disable multiline-ternary */
import React, { useState } from 'react'
import DevnetAccountSelector from '../../components/DevnetAccountSelector'
import './styles.css'

import EnvironmentSelector from '../../components/EnvironmentSelector'
import Wallet from '../../components/Wallet'
import { RxDotFilled } from 'react-icons/rx'
import Accordian, {
  AccordianItem,
  AccordionContent,
  AccordionTrigger
} from '../../components/ui_components/Accordian'
import ManualAccount from '../../components/ManualAccount'
import { useAtom, useAtomValue } from 'jotai'
import { type Env, envAtom, isDevnetAliveAtom } from '../../atoms/environment'
import * as Tabs from '@radix-ui/react-tabs'

const Environment: React.FC = () => {
  const [env, setEnv] = useAtom(envAtom)
  const isDevnetAlive = useAtomValue(isDevnetAliveAtom)

  const [prevEnv, setPrevEnv] = useState<Env>(env)

  const [currentPane, setCurrentPane] = useState('environment')

  return (
    <div className="starknet-connection-component mb-8">
      <Tabs.Root defaultValue={'environment'}>
        <Tabs.List className={'flex justify-between rounded tab-list tab-header-env'}>
          <Tabs.List className={'tabs-trigger'}></Tabs.List>
          <Tabs.Trigger className={'tabs-trigger'} value={'environment'}>Environment</Tabs.Trigger>
          <Tabs.Trigger className={'tabs-trigger'} value={'test-accounts'}>Test Accounts</Tabs.Trigger>
          <Tabs.List className={'tabs-trigger'}></Tabs.List>
        </Tabs.List>

        <Tabs.Content value={'environment'} className={'tabs-content-env'}>
          <div>
            <div className="flex flex-column">
              {env !== 'manual' ? (
                  <div>
                    <div className="flex flex-column">
                      <label className="">Environment selection</label>
                      <div className="flex_dot">
                        <EnvironmentSelector />
                        {env === 'wallet'
                          ? (
                                <RxDotFilled
                                    size={'30px'}
                                    color="rebeccapurple"
                                    title="Wallet is active"
                                />
                            )
                          : isDevnetAlive
                            ? (
                                    <RxDotFilled
                                        size={'30px'}
                                        color="lime"
                                        title="Devnet is live"
                                    />
                              )
                            : (
                                    <RxDotFilled
                                        size={'30px'}
                                        color="red"
                                        title="Devnet server down"
                                    />
                              )}
                      </div>
                    </div>
                    <div className="flex flex-column">
                      {['localDevnet', 'remoteDevnet', 'localKatanaDevnet'].includes(env) ? (
                          <DevnetAccountSelector />
                      ) : (
                          <Wallet
                              setPrevEnv={setPrevEnv}
                          />
                      )}
                    </div>
                  </div>
              ) : (
                  <ManualAccount prevEnv={prevEnv} />
              )}
            </div>
          </div>
        </Tabs.Content>
        <Tabs.Content value={'test-accounts'}>
          <ManualAccount prevEnv={prevEnv} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

export { Environment }
