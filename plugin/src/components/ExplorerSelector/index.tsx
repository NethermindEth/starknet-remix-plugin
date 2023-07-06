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
}

const ExplorerSelector: React.FC<IExplorerSelector> = ({
  path,
  text,
  title,
  isInline
}) => {
  const [currentExplorerKey, setCurrentExplorerKey] =
    useState<keyof typeof EXPLORERS>('voyager')
  const [currentNetwork, setCurrentNetwork] =
    useState<keyof typeof EXPLORERS.voyager>('goerli')

  return (
    <div className={`${isInline && 'inline-root-wrapper'}`}>
      <div className="selectors-wrapper">
        <D.Root>
          <D.Trigger>
            <div className="network-dropdown-trigger">
              <img
                className="img-explorer-logo"
                src={explorerToLogo(currentExplorerKey)}
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
                      setCurrentExplorerKey(v as keyof typeof EXPLORERS)
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
        <D.Root>
          <D.Trigger>
            <div className="network-dropdown-trigger">
              <p>{currentNetwork}</p>
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
      </div>
      <a
        href={`${EXPLORERS[currentExplorerKey][currentNetwork]}${path}`}
        target="_blank"
        title={title || text}
        className="explorer-link"
      >
        {text || `View on ${currentExplorerKey}`}
      </a>
    </div>
  )
}

export default ExplorerSelector
