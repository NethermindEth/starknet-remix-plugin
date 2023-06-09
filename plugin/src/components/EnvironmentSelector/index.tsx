import React, { useContext } from 'react'
import { type Devnet, devnets, getDevnetIndex } from '../../utils/network'
import { type ConnectOptions, type DisconnectOptions } from 'get-starknet'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import { Provider } from 'starknet'

interface EnvironmentSelectorProps {
  devnetEnv: boolean
  setDevnetEnv: (devnetEnv: boolean) => void
  devnet: Devnet
  setDevnet: (devnet: Devnet) => void
  connectWalletHandler: (options?: ConnectOptions) => Promise<void>
  disconnectWalletHandler: (options?: DisconnectOptions) => Promise<void>
}

const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = (props) => {
  const { setProvider } = useContext(ConnectionContext)

  async function handleEnvironmentChange (event: any) {
    if (event.target.value > 0) {
      props.setDevnet(devnets[event.target.value - 1])
      props.setDevnetEnv(true)
      props.disconnectWalletHandler()
      setProvider(
        new Provider({
          sequencer: {
            baseUrl: devnets[event.target.value - 1].url
          }
        })
      )
      return
    }
    props.setDevnetEnv(false)
    props.connectWalletHandler()
  }

  return (
    <select
      className="custom-select"
      aria-label=".form-select-sm example"
      onChange={handleEnvironmentChange}
      defaultValue={getDevnetIndex(devnets, props.devnet) + 1}
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
            Injected Wallet Provider
          </option>
        ]
      )}
    </select>
  )
}

export default EnvironmentSelector
