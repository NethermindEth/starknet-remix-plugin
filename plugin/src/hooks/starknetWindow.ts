import {
  type StarknetWindowObject,
  type ConnectOptions,
  type DisconnectOptions,
  connect,
  disconnect
} from 'get-starknet'
import { useEffect, useState } from 'react'
import useAccount from './useAccount'
import useProvider from './useProvider'
import useRemixClient from './useRemixClient'
import { starknetWindowObject as stObj } from '../atoms/connection'
import { useAtom } from 'jotai'

const useStarknetWindow = (): {
  starknetWindowObject: StarknetWindowObject | null
  setStarknetWindowObject: React.Dispatch<React.SetStateAction<StarknetWindowObject | null>>
  currentChainId: string | undefined
  connectWalletHandler: (options?: ConnectOptions) => Promise<void>
  disconnectWalletHandler: (options?: DisconnectOptions) => Promise<void>
  refreshWalletConnection: () => Promise<void>
} => {
  const [starknetWindowObject, setStarknetWindowObject] = useAtom(stObj)

  const { remixClient } = useRemixClient()
  const { setAccount } = useAccount()
  const { setProvider } = useProvider()

  const [currentChainId, setCurrentChainId] = useState<string | undefined>(undefined)
  const getChainId = async (): Promise<void> => {
    if (starknetWindowObject != null) {
      const value: string | undefined = await starknetWindowObject?.provider?.getChainId()
      setCurrentChainId(value)
    }
  }

  useEffect((): void => {
    if (starknetWindowObject != null) {
      getChainId().catch(e => {
        console.error(e)
      })
    }
  }, [starknetWindowObject])

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

  const refreshWalletConnection = async (): Promise<void> => {
    if (starknetWindowObject !== null) await disconnectWalletHandler()
    await connectWalletHandler()
  }

  return {
    starknetWindowObject,
    currentChainId,
    setStarknetWindowObject,
    connectWalletHandler,
    disconnectWalletHandler,
    refreshWalletConnection
  }
}

export default useStarknetWindow
