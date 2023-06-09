import { DisconnectOptions } from 'get-starknet'
import { ReactNode } from 'react'
import './envCard.css'

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
  return (
    <div className="border-top border-bottom">
      {header && (
        <div className="card-header">
          {/* <h5 className="mb-0">{header}</h5> */}
          <button
            type="button"
            className="mb-0 btn btn-sm float-left env-btn"
            onClick={async () => {
              await disconnectWalletHandler()
              setEnv('devnet')
            }}
          >
            {header}
          </button>
          <button
            type="button"
            className="mb-0 btn btn-sm btn-outline-secondary float-right rounded-pill env-testnet-btn"
            onClick={() => setEnv('manual')}
          >
            Create testnet account
          </button>
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  )
}
