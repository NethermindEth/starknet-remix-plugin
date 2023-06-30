/* eslint-disable react/prop-types */
import { type DisconnectOptions } from 'get-starknet'
import { useContext, type ReactNode, useState } from 'react'
import React from 'react'
import './envCard.css'
import EnvironmentContext from '../../contexts/EnvironmentContext'

interface EnvCardProps {
  header: string
  setEnv: (env: string) => void
  disconnectWalletHandler: (options?: DisconnectOptions) => Promise<void>
  children: ReactNode
}

export const EnvCard: React.FC<EnvCardProps> = ({
  header,
  setEnv,
  disconnectWalletHandler,
  children
}) => {
  const { env } = useContext(EnvironmentContext)
  const [prevEnv, setPrevEnv] = useState<string>(env)

  return (
    <div className="border-top border-bottom">
      {header !== '' && (
        <div className="card-header">
          {/* <h5 className="mb-0">{header}</h5> */}
          <button
            type="button"
            className="mb-0 btn btn-sm float-left env-btn"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={async () => {
              setEnv(prevEnv)
            }}
          >
            {header}
          </button>
          <button
            type="button"
            className="mb-0 btn btn-sm btn-outline-secondary float-right rounded-pill env-testnet-btn"
            onClick={() => {
              setPrevEnv(env)
              setEnv('manual')
            }}
          >
            Create testnet account
          </button>
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  )
}
