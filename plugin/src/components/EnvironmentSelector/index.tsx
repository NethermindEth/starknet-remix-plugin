import React, { useState } from 'react'
import { devnets } from '../../utils/network'

import './styles.css'
import { devnetAtom, envAtom } from '../../atoms/environment'
import { useAtom, useSetAtom } from 'jotai'
import useStarknetWindow from '../../hooks/starknetWindow'
import useProvider from '../../hooks/useProvider'
import * as D from '../../components/ui_components/Dropdown'
import { BsChevronDown } from 'react-icons/bs'

const EnvironmentSelector: React.FC = () => {
  const { setProvider } = useProvider()
  const [env, setEnv] = useAtom(envAtom)
  const setDevnet = useSetAtom(devnetAtom)
  const { starknetWindowObject, connectWalletHandler } = useStarknetWindow()

  const handleEnvironmentChange = (ipValue: string): void => {
    const value = parseInt(ipValue)
    if (!isNaN(value) && value > 0) {
      setDevnet(devnets[value - 1])
      switch (value) {
        case 1:
          setEnv('localDevnet')
          break
        case 2:
          setEnv('remoteDevnet')
          break
        case 3:
          setEnv('localKatanaDevnet')
          break
      }
      setProvider(null)
      return
    }
    setEnv('wallet')
    if (starknetWindowObject === null) {
      connectWalletHandler()
        .catch(
          e => {
            console.error(e)
          })
    }
  }

  const getActiveEnv = (lEnv: typeof env): string => {
    switch (lEnv) {
      case 'manual': return 'Manual'
      case 'localDevnet': return 'Local Devnet'
      case 'remoteDevnet': return 'Remote Devnet'
      case 'localKatanaDevnet': return 'Local Katana Devnet'
      case 'wallet': return 'Wallet'
    }
  }

  const [dropdownControl, setDropdownControl] = useState(false)

  return (
    <div className="environment-selector-wrapper">
      <D.Root open={dropdownControl} onOpenChange={(e) => { setDropdownControl(e) }}>
        <D.Trigger>
          <div className="flex flex-row justify-content-space-between align-items-center p-2 br-1 devnet-trigger-wrapper">
            <label className='text-light text-sm m-0'>{getActiveEnv(env)}</label>
            <BsChevronDown style={{
              transform: dropdownControl ? 'rotate(180deg)' : 'none',
              transition: 'all 0.3s ease'
            }} />
          </div>
        </D.Trigger>
        <D.Portal>
          <D.Content>
            <D.Item
              key={'0wallet'}
              onClick={() => {
                handleEnvironmentChange('0')
              }}
            >
              Wallet
            </D.Item>
            {devnets.map((devnet, i) => {
              return (
                <D.Item
                  key={i.toString() + devnet?.name}
                  onClick={() => {
                    handleEnvironmentChange((i + 1).toString())
                  }}
                >
                  {devnet?.name}
                </D.Item>
              )
            })}
          </D.Content>
        </D.Portal>
      </D.Root>
    </div>
  )
}

export default EnvironmentSelector
