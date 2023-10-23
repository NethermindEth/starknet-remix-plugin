import React, { useEffect, useState } from 'react'
import copy from 'copy-to-clipboard'
import './wallet.css'
import { MdCopyAll } from 'react-icons/md'
import {
  type Network,
  networkEquivalentsRev
} from '../../utils/constants'
import ExplorerSelector, { useCurrentExplorer } from '../ExplorerSelector'
import { getExplorerUrl, trimStr } from '../../utils/utils'
import useStarknetWindow from '../../hooks/starknetWindow'

interface WalletProps {
  setPrevEnv: (newEnv: string) => void
}

const Wallet: React.FC<WalletProps> = (props) => {
  const [showCopied, setCopied] = useState(false)

  const {
    starknetWindowObject,
    connectWalletHandler,
    disconnectWalletHandler
  } = useStarknetWindow()

  const refreshWalletConnection = async (e: any): Promise<void> => {
    e.preventDefault()
    if (starknetWindowObject !== null) disconnectWalletHandler()
    await connectWalletHandler()
  }

  const [currentChain, setCurrentChain] = useState<string>(
    'goerli-alpha'
  )

  useEffect(() => {
    starknetWindowObject?.on('accountsChanged', (accounts: string[]) => {
      console.log('accountsChanged', accounts)
    })
    starknetWindowObject?.on('networkChanged', (network?: string) => {
      console.log('networkChanged', network)
    })
  }, [starknetWindowObject])

  useEffect(() => {
    setTimeout(async () => {
      const currChainId = await starknetWindowObject?.provider?.getChainId()
      if (currChainId !== undefined) setCurrentChain(networkEquivalentsRev.get(currChainId) ?? 'goerli-alpha')
    }, 100)
  }, [starknetWindowObject])

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
      {starknetWindowObject != null
        ? (
        <>
          <div className="wallet-row-wrapper">
            <div className="wallet-wrapper">
              <img src={starknetWindowObject?.icon} alt="wallet icon" />
              <p className="text"> {starknetWindowObject?.id}</p>
              <p className="text text-right text-secondary"> {currentChain}</p>
            </div>
            <div className="account-network-wrapper">
              <ExplorerSelector
                path={`/contract/${starknetWindowObject?.account?.address ?? ''}`}
                title={starknetWindowObject?.account?.address}
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
              title={starknetWindowObject?.account?.address}
            >
              <a
                href={`${getExplorerUrl(explorerHook.explorer, currentChain as Network)}/contract/${starknetWindowObject?.account?.address ?? ''}`}
                target="_blank"
                rel="noreferer noopener noreferrer"
              >
                {trimStr(
                  starknetWindowObject?.account?.address ?? '',
                  10
                )}
              </a>
            </p>
            <span style={{ position: 'relative' }}>
              <button
                className="btn p-0"
                onClick={() => {
                  copy(starknetWindowObject?.account?.address ?? '')
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
          )
        : (
        <p> Wallet not connected</p>
          )}
    </div>
  )
}

export default Wallet
