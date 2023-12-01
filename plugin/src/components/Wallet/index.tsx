import React, { useMemo, useState } from 'react'
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
import { type StarknetChainId } from '../../utils/starknet'
import type { Env } from '../../atoms/environment'
import { useAccount } from '@starknet-react/core'
import ConnectModal from '../starknet/connect'

interface WalletProps {
  setPrevEnv: (newEnv: Env) => void
}

const Wallet: React.FC<WalletProps> = (props) => {
  const [showCopied, setCopied] = useState(false)

  const {
    starknetWindowObject,
    currentChainId,
    refreshWalletConnection
  } = useStarknetWindow()

  // const { status } = useAccount()

  const currentChain = useMemo(() => {
    // Explicit cast here is fine, in worst case will coalese to `goerli-alpha`
    return networkEquivalentsRev.get(currentChainId as StarknetChainId) ?? 'goerli-alpha'
  }, [currentChainId])

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
            e.preventDefault()
            refreshWalletConnection().catch(e => {
              console.error(e)
            })
          }}
        >
          Reconnect
        </button>
      </div>
      <ConnectModal />
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
                  path={`/contract/${starknetWindowObject?.account?.address as string ?? ''}`}
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
                  href={`${getExplorerUrl(explorerHook.explorer, currentChain as Network)}/contract/${starknetWindowObject?.account?.address as string ?? ''}`}
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
