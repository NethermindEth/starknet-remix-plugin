import {
  type StarknetWindowObject,
  type ConnectOptions,
  type DisconnectOptions,
  connect,
  disconnect
} from 'get-starknet'
import { useContext, useState } from 'react'
import { ConnectionContext } from '../contexts/ConnectionContext'
import { RemixClientContext } from '../contexts/RemixClientContext'

const useStarknetWindow = (): {
  starknetWindowObject: StarknetWindowObject | null
  setStarknetWindowObject: React.Dispatch<React.SetStateAction<StarknetWindowObject | null>>
  connectWalletHandler: (options?: ConnectOptions) => Promise<void>
  disconnectWalletHandler: (options?: DisconnectOptions) => Promise<void>
} => {
  // Recfactor Context
  const remixClient = useContext(RemixClientContext)
  const { setAccount, setProvider } =
        useContext(ConnectionContext)

  const [starknetWindowObject, setStarknetWindowObject] = useState<StarknetWindowObject | null>(null)

  const connectWalletHandler = async (
    options: ConnectOptions = {
      modalMode: 'alwaysAsk',
      modalTheme: 'dark'
    }
  ): Promise<void> => {
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
      starknetWindowObject.off('accountsChanged', (_accounts: string[]) => { })
      starknetWindowObject.off('networkChanged', (_network?: string) => { })
    }
    await disconnect(options)
    setStarknetWindowObject(null)
    setAccount(null)
    setProvider(null)
  }

  return { starknetWindowObject, setStarknetWindowObject, connectWalletHandler, disconnectWalletHandler }
}

export default useStarknetWindow
