import React from 'react'

import { useConnect, type Connector } from '@starknet-react/core'

export default function ConnectModal (): JSX.Element {
  const { connect, connectors } = useConnect()
  return (
    <div className="flex flex-col gap-4">
      {connectors.map((connector: Connector) => (
        <button
          className="btn btn-primary"
          key={connector.id}
          onClick={() => {
            connect({ connector })
          }}
          disabled={!connector.available()}
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  )
}
