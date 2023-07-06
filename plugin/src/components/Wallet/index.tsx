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
  networkNameEquivalents,
  networkNameEquivalentsRev
} from '../../utils/constants'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import { BsChevronDown } from 'react-icons/bs'
import EnvironmentContext from '../../contexts/EnvironmentContext'

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
        onClick={(e) => {
          refreshWalletConnection(e)
        }}
      >
        Reconnect
      </button>
      <button
        type="button"
        className="mb-0 btn btn-sm btn-outline-secondary float-right rounded-pill env-testnet-btn"
        onClick={() => {
          if (env !== 'manual') props.setPrevEnv(env)
          setEnv('manual')
        }}
      >
        Create Accounts
      </button>
      {props.starknetWindowObject != null ? (
        <>
          <div className="wallet-row-wrapper">
            <div className="wallet-wrapper">
              <img src={props.starknetWindowObject?.icon} alt="wallet icon" />
              <p className="text"> {props.starknetWindowObject?.id}</p>
              <Tooltip
                icon={<CiWarning color="yellow" />}
                content={`${
                  props.starknetWindowObject?.name ?? 'It'
                } doesn't support cairo 1 contracts`}
              />
            </div>
            <div className="account-network-wrapper">
              <D.Root>
                <D.Trigger>
                  <label className="account-network-selector">
                    Connected to {currentNetwork} <BsChevronDown />
                  </label>
                </D.Trigger>
                <D.Portal>
                  <D.Content>
                    {availableNetworks.map((v, i) => {
                      return (
                        <D.Item
                          key={i}
                          onClick={() => {
                            setCurrentNetwork(v)
                          }}
                        >
                          {v}
                        </D.Item>
                      )
                    })}
                  </D.Content>
                </D.Portal>
              </D.Root>
            </div>
          </div>
          <div className="account-wrapper">
            <span>
              <p
                className="text account"
                title={props.starknetWindowObject?.account?.address}
              >
                {trimAddress(
                  props.starknetWindowObject?.account?.address ?? ''
                )}
              </p>
              <button
                className="btn"
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
              {showCopied && <p>Copied</p>}
            </span>
            <a href={voyagerLink} target="_blank" rel="noopnener noreferrer">
              View on Voyager
            </a>
          </div>
        </>
      ) : (
        <p> Wallet not connected</p>
      )}
    </div>
  )
}

export default Wallet
