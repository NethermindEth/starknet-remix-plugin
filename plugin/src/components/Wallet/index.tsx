/* eslint-disable multiline-ternary */
/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useContext, useEffect, useState } from 'react'
import {
  type ConnectOptions,
  type DisconnectOptions,
  type StarknetWindowObject
} from 'get-starknet'

import copy from 'copy-to-clipboard'
import Tooltip from '../../ui_components/Tooltip'
import { CiWarning } from 'react-icons/ci'
// import { BsChevronDown } from 'react-icons/bs'
import * as D from '../../ui_components/Dropdown'

import './wallet.css'
import { MdCopyAll } from 'react-icons/md'
import { Provider, constants } from 'starknet'
import {
  networkEquivalents,
  networkEquivalentsRev,
  networkNameEquivalents,
  networkNameEquivalentsRev
} from '../../utils/constants'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import { BsChevronDown } from 'react-icons/bs'
import EnvironmentContext from '../../contexts/EnvironmentContext'
import ExplorerSelector, { useCurrentExplorer } from '../ExplorerSelector'
import { trimStr } from '../../utils/utils'

const trimAddress = (adr: string): string => {
  if (adr.length > 0 && adr.startsWith('0x')) {
    const len = adr.length
    return `${adr.slice(0, 6)}...${adr.slice(len - 6, len)}`
  }
  return adr
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const makeVoyagerLink = async (starknetObj?: StarknetWindowObject | null) => {
  if (starknetObj != null) {
    const chainId = await starknetObj?.account?.getChainId()
    if (chainId === '0x534e5f4d41494e') {
      return `https://goerli.voyager.online/contract/${
        starknetObj?.account?.address ?? ''
      }`
    } else {
      return `https://voyager.online/contract/${
        starknetObj?.account?.address ?? ''
      }`
    }
  }
  return 'https://voyager.online'
}

interface WalletProps {
  starknetWindowObject: StarknetWindowObject | null
  connectWalletHandler: (options?: ConnectOptions) => void
  disconnectWalletHandler: (options?: DisconnectOptions) => void
  setPrevEnv: (newEnv: string) => void
}

const Wallet: React.FC<WalletProps> = (props) => {
  const [showCopied, setCopied] = useState(false)

  const [voyagerLink, setVoyagerLink] = useState('')
  const { setProvider } = useContext(ConnectionContext)

  const { env, setEnv } = useContext(EnvironmentContext)

  useEffect(() => {
    void (async () => {
      const link = await makeVoyagerLink(props.starknetWindowObject)
      setVoyagerLink(link)
    })()
  }, [props])

  const refreshWalletConnection = (e: any): void => {
    e.preventDefault()
    console.log('refreshWalletConnection')
    if (props.starknetWindowObject !== null) props.disconnectWalletHandler()
    props.connectWalletHandler()
  }

  const [currentNetwork, setCurrentNetwork] = useState('goerli')
  const [availableNetworks] = useState<string[]>(
    Array.from(networkEquivalents.keys())
  )

  const [currentChain, setCurrentChain] = useState<string>(
    'goerli-alpha'
  )

  useEffect(() => {
    const currChain =
      props.starknetWindowObject?.chainId ?? constants.NetworkName.SN_GOERLI
    setCurrentNetwork(
      networkNameEquivalentsRev.get(currChain as constants.NetworkName) ??
        'goerli'
    )
  }, [props.starknetWindowObject])

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
    setCurrentNetwork(chainName)
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
                href={`${explorerHook.currentLink}/contract/${props.starknetWindowObject?.account?.address ?? ''}`}
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
