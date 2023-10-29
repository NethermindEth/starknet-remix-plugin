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

const Environment: React.FC = () => {
  const [env, setEnv] = useAtom(envAtom)
  const isDevnetAlive = useAtomValue(isDevnetAliveAtom)

  const [prevEnv, setPrevEnv] = useState<Env>(env)

  const [currentPane, setCurrentPane] = useState('environment')

  return (
    <div className="starknet-connection-component mb-8">
      <Accordian type="single" value={currentPane} defaultValue={'environment'}>
        <AccordianItem value="environment">
          <AccordionTrigger
            onClick={() => { setCurrentPane(currentPane === 'environment' ? '' : 'environment') }
            }
          >
            <div className="trigger-env">
              <p>Environment</p>
              <button
                type="button"
                className="mb-0 btn btn-sm btn-outline-secondary float-right rounded-pill env-testnet-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  if (env !== 'manual') setPrevEnv(env)
                  setEnv('manual')
                }}
              >
                Test Accounts
              </button>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <>
              <div className="flex flex-column">
                {env !== 'manual' ? (
                  <>
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
                      {['localDevnet', 'remoteDevnet'].includes(env) ? (
                        <DevnetAccountSelector />
                      ) : (
                        <Wallet
                          setPrevEnv={setPrevEnv}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <ManualAccount prevEnv={prevEnv} />
                )}
              </div>
            </>
          </AccordionContent>
        </AccordianItem>
      </Accordian>
    </div>
  )
}

export { Environment }
