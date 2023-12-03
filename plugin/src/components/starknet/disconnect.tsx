import React from 'react'

import { useDisconnect } from '@starknet-react/core'

export default function DisconnectModal (): JSX.Element {
  const { disconnect } = useDisconnect()

  return (
    <div className="w-full flex justify-center">
      <div className="flex flex-col gap-4 justify-center">
        <button
          className='btn btn-secondary justify-center'
          onClick={() => { disconnect() }}
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}
