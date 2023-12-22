/* eslint-disable multiline-ternary */
import React, { useState } from 'react'
import DevnetAccountSelector from '../../components/DevnetAccountSelector'
import './styles.css'

import EnvironmentSelector from '../../components/EnvironmentSelector'
import Wallet from '../../components/Wallet'
import ManualAccount from '../../components/ManualAccount'
import { useAtomValue } from 'jotai'
import { type Env, envAtom } from '../../atoms/environment'
import * as Tabs from '@radix-ui/react-tabs'
import Accordian, { AccordianItem, AccordionContent, AccordionTrigger } from '../../components/ui_components/Accordian'
import { CurrentEnv } from '../../components/CurrentEnv'
import { DevnetStatus } from '../../components/DevnetStatus'

const Environment: React.FC = () => {
  const env = useAtomValue(envAtom)

  const [prevEnv, setPrevEnv] = useState<Env>(env)

  return (
    <Accordian className={'accordian-env'} type={'single'} defaultValue={'closed'}>
      <AccordianItem value={'closed'}></AccordianItem>
      <AccordianItem value={'env'} className={'accordian-item-env'}>
        <AccordionTrigger className={'accordian-trigger-env'}>
          <CurrentEnv/>
        </AccordionTrigger>

        <AccordionContent className={'accordian-content-env'}>
          <div className="starknet-connection-component">
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
                              <DevnetStatus />
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
        </AccordionContent>
      </AccordianItem>
    </Accordian>
  )
}

export { Environment }
