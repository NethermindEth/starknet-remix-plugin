import React from 'react'
import './currentEnv.css'
import { useAtomValue } from 'jotai'
import { envAtom, envName } from '../../atoms/environment'
import { selectedAccountAtom } from '../../atoms/manualAccount'
import { getShortenedHash } from '../../utils/utils'
import { ethers } from 'ethers'
import { DevnetStatus } from '../DevnetStatus'

export const CurrentEnv: React.FC = () => {
  const env = useAtomValue(envAtom)

  const selectedAccount = useAtomValue(selectedAccountAtom)

  const selectedAccountAddress = (selectedAccount != null)
    ? getShortenedHash(selectedAccount?.address, 6, 4)
    : 'No account selected'

  const selectedAccountBalance = ethers.utils.formatEther(selectedAccount?.balance ?? 0)

  return (
    // <div>{ envName(env) }, { selectedAccountAddress }, { selectedAccountBalance } ETH </div>
    <div className={'current-env-root'}>
      <div className={'devnet-status'}>
        <DevnetStatus/>
      </div>
      <div className={'chain-info-box'}>
        <span className={'chain-name'}>
          {envName(env)}
        </span>
        <span className={'chain-account-info'}>
          {selectedAccountAddress} {(selectedAccount != null) ? `(${selectedAccountBalance} ETH)` : ''}
        </span>
      </div>
    </div>
  )
}
