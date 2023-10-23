import React from 'react'
import { devnets } from '../../utils/network'
import { type ConnectOptions, type DisconnectOptions } from 'get-starknet'

import './styles.css'
import { devnetAtom, envAtom } from '../../atoms/environment'
import { useAtom, useSetAtom } from 'jotai'
import useStarknetWindow from '../../hooks/starknetWindow'
import useProvider from '../../hooks/useProvider'

interface EnvironmentSelectorProps {
  connectWalletHandler: (options?: ConnectOptions) => Promise<void>
  disconnectWalletHandler: (options?: DisconnectOptions) => Promise<void>
}

const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = (props) => {
  const { setProvider } = useProvider()
  const [env, setEnv] = useAtom(envAtom)
  const setDevnet = useSetAtom(devnetAtom)
  const { starknetWindowObject } = useStarknetWindow()

  async function handleEnvironmentChange (event: any): Promise<void> {
    const value = parseInt(event.target.value)
    if (value > 0) {
      setDevnet(devnets[value - 1])
      if (value === 2) setEnv('remoteDevnet')
      else setEnv('localDevnet')
      setProvider(null)
      return
    }
    setEnv('wallet')
    if (starknetWindowObject === null) await props.connectWalletHandler()
  }

  const getDefualtIndex = (): number => {
    if (env === 'wallet') return 0
    if (env === 'localDevnet') return 1
    return 2
  }

  return (
    <div className="environment-selector-wrapper">
      <select
        className="custom-select"
        aria-label=".form-select-sm example"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onChange={handleEnvironmentChange}
        defaultValue={getDefualtIndex()}
      >
        {devnets.reduce<JSX.Element[]>(
          (acc, devnet, index) => {
            acc.push(
              <option value={index + 1} key={index + 1}>
                {devnet.name}
              </option>
            )
            return acc
          },
          [
            <option value={0} key={0}>
              Wallet Selection
            </option>
          ]
        )}
      </select>
    </div>
  )
}

export default EnvironmentSelector
