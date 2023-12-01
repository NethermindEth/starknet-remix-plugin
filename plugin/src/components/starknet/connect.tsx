import React from 'react'

import { useConnect, type Connector } from '@starknet-react/core'

import { Dialog, DialogContent, DialogHeader, DialogTrigger } from './ui/dialog'

import { Button } from './ui/button'

export default function ConnectModal (): JSX.Element {
  const { connect, connectors } = useConnect()
  return (
    <div className="w-full flex justify-end">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost">Connect Wallet</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>Connect Wallet</DialogHeader>
          <div className="flex flex-col gap-4">
            {connectors.map((connector: Connector) => (
              <Button
                key={connector.id}
                onClick={() => {
                  connect({ connector })
                }}
                disabled={!connector.available()}
              >
                Connect {connector.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
