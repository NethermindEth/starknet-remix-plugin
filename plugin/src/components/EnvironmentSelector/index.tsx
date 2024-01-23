import React from 'react'
import { devnets } from '../../utils/network'

import './styles.css'
import { devnetAtom, envAtom } from '../../atoms/environment'
import { useAtom, useSetAtom } from 'jotai'
import useProvider from '../../hooks/useProvider'
import { BsChevronDown } from 'react-icons/bs'
import * as Select from '../../components/ui_components/Select'
const EnvironmentSelector: React.FC = () => {
  const { setProvider } = useProvider()
  const [env, setEnv] = useAtom(envAtom)
  const setDevnet = useSetAtom(devnetAtom)

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

  return (
    <div className="environment-selector-wrapper">
      <Select.Root onValueChange={handleEnvironmentChange}>
        <Select.Trigger className="flex flex-row justify-content-space-between align-items-center p-2 br-1 devnet-trigger-wrapper">
          <Select.Value placeholder={getActiveEnv(env)}>
            {getActiveEnv(env)}
          </Select.Value>
          <Select.Icon>
            <BsChevronDown />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content>
            <Select.Viewport>
              <Select.Item value="0" className="text-light text-sm m-0">
                <Select.ItemText>Wallet</Select.ItemText>
              </Select.Item>
              {devnets.map((devnet, i) => (
                  <Select.Item key={i.toString() + devnet?.name} value={(i + 1).toString()}>
                    <Select.ItemText>{devnet?.name}</Select.ItemText>
                  </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}

export default EnvironmentSelector
