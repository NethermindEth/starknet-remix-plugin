import React, { useContext } from 'react'
import { type Devnet, devnets, getDevnetIndex } from '../../utils/network'
import { type ConnectOptions, type DisconnectOptions } from 'get-starknet'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import { RxDotFilled } from 'react-icons/rx'
import { Provider } from 'starknet'

interface EnvironmentSelectorProps {
  env: string
  setEnv: (devnetEnv: string) => void
  devnet: Devnet
  setDevnet: (devnet: Devnet) => void
  connectWalletHandler: (options?: ConnectOptions) => Promise<void>
  disconnectWalletHandler: (options?: DisconnectOptions) => Promise<void>
}

const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = (props) => {
  const { setProvider } = useContext(ConnectionContext)

  async function handleEnvironmentChange(event: any) {
    if (event.target.value > 0) {
      props.setDevnet(devnets[event.target.value - 1])
      props.setEnv('devnet')
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
    props.setEnv('wallet')
    props.connectWalletHandler()
  }

  return (
    <div className="devnet-account-selector-wrapper">
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
      {devnets.length > 0 && <RxDotFilled size={'30px'} color="lime" />}
    </div>
  )
}

export default EnvironmentSelector
