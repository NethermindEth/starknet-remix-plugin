import React, { useState } from 'react'
import * as D from '../../ui_components/Dropdown'

import './index.css'
import { BsChevronDown } from 'react-icons/bs'

const VOYAGER_LOGO = 'https://voyager.online/favicons/favicon-32x32.png'
const STARKSCAN_LOGO = 'https://starkscan.co/img/company/favicon.ico'

const EXPLORERS = {
  voyager: {
    goerli: 'https://goerli.voyager.online',
    'goerli-2': 'https://goerli-2.voyager.online',
    mainnet: 'https://voyager.online'
  },
  starkscan: {
    goerli: 'https://testnet.starkscan.co',
    'goerli-2': 'https://testnet-2.starkscan.co',
    mainnet: 'https://starkscan.co'
  }
}

const explorerToLogo = (explorer: keyof typeof EXPLORERS) => {
  switch (explorer) {
    case 'starkscan':
      return STARKSCAN_LOGO
    case 'voyager':
    default:
      return VOYAGER_LOGO
  }
}

type IExplorerSelector = {
  path: string
  text?: string
  title?: string
  isInline?: boolean
  isNetworkVisible?: boolean
  isTextVisible?: boolean
  controlHook: IUseCurrentExplorer
}

type IUseCurrentExplorer = {
  explorer: 'voyager' | 'starkscan'
  network: 'goerli' | 'goerli-2' | 'mainnet'
  currentLink: string
  setExplorer: React.Dispatch<React.SetStateAction<'voyager' | 'starkscan'>>
  setCurrentNetwork: React.Dispatch<keyof typeof EXPLORERS.voyager>
}
export const useCurrentExplorer = (): IUseCurrentExplorer => {
  const [currentExplorerKey, setCurrentExplorerKey] =
    useState<keyof typeof EXPLORERS>('voyager')
  const [currentNetwork, setCurrentNetwork] =
    useState<keyof typeof EXPLORERS.voyager>('goerli')

  return {
    explorer: currentExplorerKey,
    network: currentNetwork,
    currentLink: EXPLORERS[currentExplorerKey][currentNetwork],
    setExplorer: setCurrentExplorerKey,
    setCurrentNetwork: setCurrentNetwork
  }
}

const ExplorerSelector: React.FC<IExplorerSelector> = ({
  path,
  text,
  title,
  isInline,
  isNetworkVisible = false,
  isTextVisible = true,
  controlHook
}) => {
  const { explorer, network, setCurrentNetwork, setExplorer } = controlHook
  return (
    <div
      className={`${isInline && 'inline-root-wrapper'}`}
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <div className="selectors-wrapper">
        <D.Root>
          <D.Trigger>
            <div className="network-dropdown-trigger">
              <img
                className="img-explorer-logo"
                src={explorerToLogo(explorer)}
              />
            </div>
          </D.Trigger>
          <D.Portal>
            <D.Content>
              {Object.keys(EXPLORERS).map((v, i) => {
                return (
                  <D.Item
                    className="styled-dropdown-item"
                    key={i}
                    onClick={() => {
                      setExplorer(v as keyof typeof EXPLORERS)
                    }}
                  >
                    <img
                      className="img-explorer-logo"
                      src={explorerToLogo(v as keyof typeof EXPLORERS)}
                    />
                    <p>{v}</p>
                  </D.Item>
                )
              })}
            </D.Content>
          </D.Portal>
        </D.Root>
        {isNetworkVisible && (
          <D.Root>
            <D.Trigger>
              <div className="network-dropdown-trigger">
                <p>{network}</p>
                <BsChevronDown />
              </div>
            </D.Trigger>
            <D.Portal>
              <D.Content>
                {Object.keys(EXPLORERS.voyager).map((v, i) => {
                  return (
                    <D.Item
                      className="styled-dropdown-item"
                      key={i}
                      onClick={() => {
                        setCurrentNetwork(v as any)
                      }}
                    >
                      <p>{v}</p>
                    </D.Item>
                  )
                })}
              </D.Content>
            </D.Portal>
          </D.Root>
        )}
      </div>
      {isTextVisible && (
        <a
          href={`${EXPLORERS[explorer][network]}${path}`}
          target="_blank"
          title={title || text}
          className="explorer-link"
        >
          {text || `View on ${network}`}
        </a>
      )}
    </div>
  )
}

export default ExplorerSelector
