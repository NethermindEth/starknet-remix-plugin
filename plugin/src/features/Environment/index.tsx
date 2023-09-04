/* eslint-disable multiline-ternary */
import React, { useContext, useState } from 'react'
import DevnetAccountSelector from '../../components/DevnetAccountSelector'
import './styles.css'
import {
  type ConnectOptions,
  type DisconnectOptions,
  connect,
  disconnect
} from 'get-starknet'
import { RemixClientContext } from '../../contexts/RemixClientContext'
import EnvironmentSelector from '../../components/EnvironmentSelector'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import Wallet from '../../components/Wallet'
import { RxDotFilled } from 'react-icons/rx'
import EnvironmentContext from '../../contexts/EnvironmentContext'
import Accordian, {
  AccordianItem,
  AccordionContent,
  AccordionTrigger
} from '../../ui_components/Accordian'
import ManualAccount from '../../components/ManualAccount'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface EnvironmentProps {}

const Environment: React.FC<EnvironmentProps> = () => {
  const remixClient = useContext(RemixClientContext)
  const { setAccount, setProvider } =
    useContext(ConnectionContext)

  const {
    env,
    setEnv,
    isDevnetAlive,
    starknetWindowObject,
    setStarknetWindowObject
  } = useContext(EnvironmentContext)
  const [prevEnv, setPrevEnv] = useState<string>(env)

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const connectWalletHandler = async (
    options: ConnectOptions = {
      modalMode: 'alwaysAsk',
      modalTheme: 'dark'
    }
  ) => {
    try {
      const connectedStarknetWindowObject = await connect(options)
      if (connectedStarknetWindowObject == null) {
        throw new Error('Failed to connect to wallet')
      }
      await connectedStarknetWindowObject.enable({ starknetVersion: 'v5' })
      connectedStarknetWindowObject.on(
        'accountsChanged',
        (accounts: string[]) => {
          console.log('accountsChanged', accounts)
          void connectWalletHandler({
            modalMode: 'neverAsk',
            modalTheme: 'dark'
          })
        }
      )

      connectedStarknetWindowObject.on('networkChanged', (network?: string) => {
        console.log('networkChanged', network)
        void connectWalletHandler({
          modalMode: 'neverAsk',
          modalTheme: 'dark'
        })
      })
      setStarknetWindowObject(connectedStarknetWindowObject)
      if (connectedStarknetWindowObject.account != null) {
        setAccount(connectedStarknetWindowObject.account)
      }
      if (connectedStarknetWindowObject.provider != null) {
        setProvider(connectedStarknetWindowObject.provider)
      }
    } catch (e) {
      if (e instanceof Error) {
        await remixClient.call('notification' as any, 'alert', e)
      }
      setStarknetWindowObject(null)
      console.log(e)
    }
  }

  const disconnectWalletHandler = async (
    options: DisconnectOptions = {
      clearLastWallet: true
    }
  ): Promise<void> => {
    if (starknetWindowObject != null) {
      starknetWindowObject.off('accountsChanged', (_accounts: string[]) => {})
      starknetWindowObject.off('networkChanged', (_network?: string) => {})
    }
    await disconnect(options)
    setStarknetWindowObject(null)
    setAccount(null)
    setProvider(null)
  }

  // END: WALLET

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
              <div className="flex">
                {env !== 'manual' ? (
                  <>
                    <div className="flex">
                      <label className="">Environment selection</label>
                      <div className="flex_dot">
                        <EnvironmentSelector
                          connectWalletHandler={connectWalletHandler}
                          disconnectWalletHandler={disconnectWalletHandler}
                        />
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
                    <div className="flex">
                      {['localDevnet', 'remoteDevnet'].includes(env) ? (
                        <DevnetAccountSelector />
                      ) : (
                        <Wallet
                          starknetWindowObject={starknetWindowObject}
                          // eslint-disable-next-line @typescript-eslint/no-misused-promises
                          connectWalletHandler={connectWalletHandler}
                          // eslint-disable-next-line @typescript-eslint/no-misused-promises
                          disconnectWalletHandler={disconnectWalletHandler}
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
