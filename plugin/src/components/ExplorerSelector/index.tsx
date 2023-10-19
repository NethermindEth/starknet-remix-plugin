import React, { useState } from 'react'
import * as D from '../ui_components/Dropdown'
import { networkExplorerUrls as EXPLORERS } from '../../utils/constants'

import './index.css'
import { type IExplorerSelector, type IUseCurrentExplorer } from '../../utils/misc'

const VOYAGER_LOGO = 'https://voyager.online/favicons/favicon-32x32.png'
const STARKSCAN_LOGO = 'https://starkscan.co/img/company/favicon.ico'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const explorerToLogo = (explorer: keyof typeof EXPLORERS) => {
  switch (explorer) {
    case 'starkscan':
      return STARKSCAN_LOGO
    case 'voyager':
    default:
      return VOYAGER_LOGO
  }
}

export const useCurrentExplorer = (): IUseCurrentExplorer => {
  const [currentExplorerKey, setCurrentExplorerKey] =
    useState<keyof typeof EXPLORERS>('voyager')

  return {
    explorer: currentExplorerKey,
    setExplorer: setCurrentExplorerKey
  }
}

const ExplorerSelector: React.FC<IExplorerSelector> = ({
  isInline,
  controlHook
}) => {
  const { explorer, setExplorer } = controlHook
  return (
    <div
      className={`${(isInline === true) ? 'inline-root-wrapper' : ''}`}
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
      </div>
    </div>
  )
}

export default ExplorerSelector
