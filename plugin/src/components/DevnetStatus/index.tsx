import { RxDotFilled } from 'react-icons/rx'
import React from 'react'
import { useAtomValue } from 'jotai'
import { envAtom, isDevnetAliveAtom } from '../../atoms/environment'

export const DevnetStatus: React.FC = () => {
  const env = useAtomValue(envAtom)
  const isDevnetAlive = useAtomValue(isDevnetAliveAtom)

  return (
      <>
        {env === 'wallet'
          ? (
                <RxDotFilled
                    size={'30px'}
                    color="rebeccapurple"
                    title="Wallet is active"
                />
            )
          : isDevnetAlive
            ? (
                    <RxDotFilled
                        size={'30px'}
                        color="lime"
                        title="Devnet is live"
                    />
              )
            : (
                    <RxDotFilled
                        size={'30px'}
                        color="red"
                        title="Devnet server down"
                    />
              )}
      </>
  )
}
