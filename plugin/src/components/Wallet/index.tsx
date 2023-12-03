import React, { useEffect, useState } from 'react'
import copy from 'copy-to-clipboard'
import './wallet.css'
import { MdCopyAll } from 'react-icons/md'
import { type Network } from '../../utils/constants'
import ExplorerSelector, { useCurrentExplorer } from '../ExplorerSelector'
import { getExplorerUrl, trimStr } from '../../utils/utils'
import type { Env } from '../../atoms/environment'
import { useAccount, useProvider } from '@starknet-react/core'
import ConnectModal from '../starknet/connect'
import DisconnectModal from '../starknet/disconnect'
import { getChainName } from '../../utils/starknet'
import useAccountAtom from '../../hooks/useAccount'
import useProviderAtom from '../../hooks/useProvider'

interface WalletProps {
  setPrevEnv: (newEnv: Env) => void
}

const Wallet: React.FC<WalletProps> = (props) => {
  const [showCopied, setCopied] = useState(false)

  const { status, account, connector, chainId } = useAccount()

  const { provider } = useProvider()

  const { setAccount } = useAccountAtom()
  const { setProvider } = useProviderAtom()

  useEffect(() => {
    if (status === 'connected') {
      setAccount(account ?? null)
      setProvider(provider ?? null)
    }
  }, [status])

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
      {status === 'connected'
        ? (
        <>
          <div className="wallet-row-wrapper">
            <div className="wallet-wrapper">
              <img src={connector?.icon?.dark} alt="wallet icon" />
              <p className="text"> {connector?.id}</p>
              <p className="text text-right text-secondary">
                {' '}
                {getChainName(chainId?.toString() ?? '')}
              </p>
            </div>
            <div className="account-network-wrapper">
              <ExplorerSelector
                path={`/contract/${(account?.address as string) ?? ''}`}
                title={account?.address}
                text="View"
                isInline
                isTextVisible={false}
                controlHook={explorerHook}
              />
            </div>
          </div>
          <div className="wallet-account-wrapper">
            <p className="text account" title={account?.address}>
              <a
                href={`${getExplorerUrl(
                  explorerHook.explorer,
                  getChainName(chainId?.toString() ?? '') as Network
                )}/contract/${(account?.address as string) ?? ''}`}
                target="_blank"
                rel="noreferer noopener noreferrer"
              >
                {trimStr(account?.address ?? '', 10)}
              </a>
            </p>
            <span style={{ position: 'relative' }}>
              <button
                className="btn p-0"
                onClick={() => {
                  copy(account?.address ?? '')
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
          <div className="wallet-actions">
            <DisconnectModal />
          </div>
        </>
          )
        : (
        <>
          {status === 'disconnected'
            ? (
            <ConnectModal />
              )
            : (
            <>
              {status === 'connecting'
                ? (
                <p>Connecting...</p>
                  )
                : (
                <p>Reconnecting...</p>
                  )}
            </>
              )}
        </>
          )}
    </div>
  )
}

export default Wallet
