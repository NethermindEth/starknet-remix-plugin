/* eslint-disable multiline-ternary */
/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useContext, useEffect, useState } from 'react'
import {
  type ConnectOptions,
  type DisconnectOptions,
  type StarknetWindowObject
} from 'get-starknet'

import copy from 'copy-to-clipboard'
import './wallet.css'
import { MdCopyAll } from 'react-icons/md'
import { Provider } from 'starknet'
import {
  type Network,
  networkEquivalents,
  networkEquivalentsRev,
  networkNameEquivalents
} from '../../utils/constants'
import ExplorerSelector, { useCurrentExplorer } from '../ExplorerSelector'
import { getExplorerUrl, trimStr } from '../../utils/utils'
import useProvider from '../../hooks/useProvider'

interface WalletProps {
  starknetWindowObject: StarknetWindowObject | null
  connectWalletHandler: (options?: ConnectOptions) => void
  disconnectWalletHandler: (options?: DisconnectOptions) => void
  setPrevEnv: (newEnv: string) => void
}

const Wallet: React.FC<WalletProps> = (props) => {
  const [showCopied, setCopied] = useState(false)

  const { setProvider } = useProvider()

  const refreshWalletConnection = (e: any): void => {
    e.preventDefault()
    console.log('refreshWalletConnection')
    if (props.starknetWindowObject !== null) props.disconnectWalletHandler()
    props.connectWalletHandler()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availableNetworks] = useState<string[]>(
    Array.from(networkEquivalents.keys())
  )

  const [currentChain, setCurrentChain] = useState<string>(
    'goerli-alpha'
  )

  useEffect(() => {
    props.starknetWindowObject?.on('accountsChanged', (accounts: string[]) => {
      console.log('accountsChanged', accounts)
    })
    props.starknetWindowObject?.on('networkChanged', (network?: string) => {
      console.log('networkChanged', network)
    })
  }, [props.starknetWindowObject])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNetworkChange = async (
    event: any,
    chainName: string
  ): Promise<void> => {
    event.preventDefault()
    const networkName = networkNameEquivalents.get(chainName)
    const chainId = networkEquivalents.get(chainName)
    if (chainName.length > 0 && chainId && networkName) {
      const resp = await props.starknetWindowObject?.request({
        type: 'wallet_switchStarknetChain',
        params: { chainId }
      })
      console.log('wallet_switchStarknetChain', resp)
      setProvider(
        new Provider({
          sequencer: {
            network: networkName,
            chainId
          }
        })
      )
    }
  }

  useEffect(() => {
    setTimeout(async () => {
      const currChainId = await props.starknetWindowObject?.provider?.getChainId()
      if (currChainId !== undefined) setCurrentChain(networkEquivalentsRev.get(currChainId) ?? 'goerli-alpha')
    }, 100)
  }, [props.starknetWindowObject])

  const explorerHook = useCurrentExplorer()

  return (
    <div
      className="flex"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1rem 0rem'
      }}
    >
      <div className="wallet-actions">
        <button
          className="btn btn-primary w-100"
          onClick={(e) => {
            refreshWalletConnection(e)
          }}
        >
          Reconnect
        </button>
      </div>
      {props.starknetWindowObject != null ? (
        <>
          <div className="wallet-row-wrapper">
            <div className="wallet-wrapper">
              <img src={props.starknetWindowObject?.icon} alt="wallet icon" />
              <p className="text"> {props.starknetWindowObject?.id}</p>
              <p className="text text-right text-secondary"> {currentChain}</p>
            </div>
            <div className="account-network-wrapper">
              <ExplorerSelector
                path={`/contract/${props.starknetWindowObject?.account?.address ?? ''}`}
                title={props.starknetWindowObject?.account?.address}
                text="View"
                isInline
                isTextVisible={false}
                controlHook={explorerHook}
              />
            </div>
          </div>
          <div className="wallet-account-wrapper">
            <p
              className="text account"
              title={props.starknetWindowObject?.account?.address}
            >
              <a
                href={`${getExplorerUrl(explorerHook.explorer, currentChain as Network)}/contract/${props.starknetWindowObject?.account?.address ?? ''}`}
                target="_blank"
                rel="noreferer noopener noreferrer"
              >
                {trimStr(
                  props.starknetWindowObject?.account?.address ?? '',
                  10
                )}
              </a>
            </p>
            <span style={{ position: 'relative' }}>
              <button
                className="btn p-0"
                onClick={() => {
                  copy(props.starknetWindowObject?.account?.address ?? '')
                  setCopied(true)
                  setTimeout(() => {
                    setCopied(false)
                  }, 1000)
                }}
              >
                <MdCopyAll />
              </button>
              {showCopied && (
                <p style={{ position: 'absolute', right: 0, minWidth: '70px' }}>
                  Copied
                </p>
              )}
            </span>
          </div>
        </>
      ) : (
        <p> Wallet not connected</p>
      )}
    </div>
  )
}

export default Wallet
