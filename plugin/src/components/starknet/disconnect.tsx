import React from 'react'

import { useDisconnect } from '@starknet-react/core'

export default function DisconnectModal (): JSX.Element {
  const { disconnect } = useDisconnect()

  return (
    <div className="w-full flex justify-center">
      <div className="flex flex-col justify-center w-full">
        <button
          className='btn btn-primary justify-cente flex-col flex w-full'
          onClick={() => { disconnect() }}
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}
