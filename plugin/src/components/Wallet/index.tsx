import React, { useEffect, useState } from 'react'
import {
  type ConnectOptions,
  type DisconnectOptions,
  type StarknetWindowObject
} from 'get-starknet'

import copy from 'copy-to-clipboard'

const trimAddress = (adr: string) => {
  if (adr && adr.startsWith('0x')) {
    const len = adr.length
    return `${adr.slice(0, 6)}...${adr.slice(len - 6, len)}`
  }
  return adr
}

const makeVoyagerLink = async (starknetObj?: StarknetWindowObject | null) => {
  if (starknetObj != null) {
    const chainId = await starknetObj?.account?.getChainId()
    if (chainId === '0x534e5f4d41494e') {
      return `https://goerli.voyager.online/contract/${starknetObj?.account?.address}`
    } else {
      return `https://voyager.online/contract/${starknetObj?.account?.address}`
    }
  }
  return 'https://voyager.online'
}

interface WalletProps {
  starknetWindowObject: StarknetWindowObject | null
  connectWalletHandler: (options?: ConnectOptions) => void
  disconnectWalletHandler: (options?: DisconnectOptions) => void
}

const Wallet: React.FC<WalletProps> = (props) => {
  const [showCopied, setCopied] = useState(false)

  const [voyagerLink, setVoyagerLink] = useState('')

  useEffect(() => {
    (async () => {
      const link = await makeVoyagerLink(props.starknetWindowObject)
      setVoyagerLink(link)
    })()
  }, [props])

  const refreshWalletConnection = async (): Promise<void> => {
    props.disconnectWalletHandler()
    props.connectWalletHandler()
  }

  return (
    <div
      className="flex"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}
    >
      <button
        className="btn btn-primary mt-2 mb-2"
        onClick={refreshWalletConnection}
      >
        Reconnect
      </button>
      <div className="wallet-wrapper">
        <img src={props.starknetWindowObject?.icon} alt="wallet icon" />
        <p className="text"> {props.starknetWindowObject?.id}</p>
      </div>
      <div className="account-wrapper">
        <span>
          <p
            className="text account"
            title={props.starknetWindowObject?.account?.address}
          >
            {trimAddress(props.starknetWindowObject?.account?.address || '')}
          </p>
          <button
            className="btn"
            onClick={() => {
              copy(props.starknetWindowObject?.account?.address || '')
              setCopied(true)
              setTimeout(() => {
                setCopied(false)
              }, 1000)
            }}
          >
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          {showCopied && <p>Copied</p>}
        </span>
        <a href={voyagerLink} target="_blank" rel="noopnener noreferrer">
          View on Voyager
        </a>
      </div>
    </div>
  )
}

export default Wallet
