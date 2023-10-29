import {
  getRoundedNumber,
  getSelectedAccountIndex,
  getShortenedHash,
  weiToEth
} from '../../utils/utils'
import { getAccounts } from '../../utils/network'
import React, { useEffect, useState } from 'react'
import { Account, Provider } from 'starknet'
import { MdCopyAll, MdRefresh } from 'react-icons/md'
import './devnetAccountSelector.css'
import copy from 'copy-to-clipboard'
import { useAtom, useAtomValue } from 'jotai'
import { availableDevnetAccountsAtom, devnetAtom, envAtom, isDevnetAliveAtom, selectedDevnetAccountAtom } from '../../atoms/environment'
import useAccount from '../../hooks/useAccount'
import useProvider from '../../hooks/useProvider'
import useRemixClient from '../../hooks/useRemixClient'

const DevnetAccountSelector: React.FC = () => {
  const { account, setAccount } = useAccount()
  const { provider, setProvider } = useProvider()
  const { remixClient } = useRemixClient()
  const env = useAtomValue(envAtom)
  const devnet = useAtomValue(devnetAtom)
  const [isDevnetAlive, setIsDevnetAlive] = useAtom(isDevnetAliveAtom)
  const [selectedDevnetAccount, setSelectedDevnetAccount] = useAtom(selectedDevnetAccountAtom)
  const [availableDevnetAccounts, setAvailableDevnetAccounts] = useAtom(availableDevnetAccountsAtom)

  const checkDevnetUrl = async (): Promise<void> => {
    try {
      const response = await fetch(`${devnet.url}/is_alive`, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const status = await response.text()

      if (status !== 'Alive!!!' || response.status !== 200) {
        setIsDevnetAlive(false)
      } else {
        setIsDevnetAlive(true)
      }
    } catch (error) {
      setIsDevnetAlive(false)
    }
  }

  // devnet live status
  useEffect(() => {
    const interval = setInterval(() => {
      checkDevnetUrl().catch(e => {
        console.error(e)
      })
    }, 3000)
    return () => {
      clearInterval(interval)
    }
  }, [devnet])

  const notifyDevnetStatus = async (): Promise<void> => {
    try {
      await remixClient.call(
        'notification' as any,
        'toast',
        `❗️ Server ${devnet.name} - ${devnet.url} is not healthy or not reachable at the moment`
      )
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!isDevnetAlive) {
      notifyDevnetStatus().catch((e) => {
        console.error(e)
      })
    }
  }, [isDevnetAlive])

  const refreshDevnetAccounts = async (): Promise<void> => {
    setAccountRefreshing(true)
    try {
      const accounts = await getAccounts(devnet.url)
      if (
        JSON.stringify(accounts) !== JSON.stringify(availableDevnetAccounts)
      ) {
        setAvailableDevnetAccounts(accounts)
      }
    } catch (e) {
      await remixClient.terminal.log({
        type: 'error',
        value: `Failed to get accounts information from ${devnet.url}`
      })
    }
    setAccountRefreshing(false)
  }

  useEffect(() => {
    setTimeout(() => {
      if (!isDevnetAlive) {
        return
      }
      refreshDevnetAccounts().catch(e => {
        console.error(e)
      })
    }, 1)
  }, [devnet, isDevnetAlive])

  useEffect(() => {
    if (
      !(
        selectedDevnetAccount !== null &&
        availableDevnetAccounts.includes(selectedDevnetAccount)
      ) &&
      availableDevnetAccounts.length > 0
    ) {
      setSelectedDevnetAccount(availableDevnetAccounts[0])
    }
  }, [availableDevnetAccounts, devnet])

  useEffect(() => {
    const newProvider = new Provider({
      sequencer: {
        baseUrl: devnet.url
      }
    })
    if (selectedDevnetAccount != null) {
      setAccount(
        new Account(
          newProvider,
          selectedDevnetAccount.address,
          selectedDevnetAccount.private_key
        )
      )
    }
    setProvider(newProvider)
  }, [devnet, selectedDevnetAccount])

  function handleAccountChange (event: any): void {
    if (event.target.value === -1) {
      return
    }
    setAccountIdx(event.target.value)
    setSelectedDevnetAccount(availableDevnetAccounts[event.target.value])
    const newProvider = new Provider({
      sequencer: {
        baseUrl: devnet.url
      }
    })
    if (provider == null) setProvider(newProvider)
    setAccount(
      new Account(
        provider ?? newProvider,
        availableDevnetAccounts[event.target.value].address,
        availableDevnetAccounts[event.target.value].private_key
      )
    )
  }

  const [accountRefreshing, setAccountRefreshing] = useState(false)
  const [showCopied, setCopied] = useState(false)

  const [accountIdx, setAccountIdx] = useState(0)

  useEffect(() => {
    setAccountIdx(0)
  }, [env])

  return (
    <div className='mt-2'>
      <label className="">Devnet account selection</label>
      <div className="devnet-account-selector-wrapper">
        <select
          className="custom-select"
          aria-label=".form-select-sm example"
          onChange={handleAccountChange}
          value={accountIdx}
          defaultValue={getSelectedAccountIndex(
            availableDevnetAccounts,
            selectedDevnetAccount
          )}
        >
          {isDevnetAlive && availableDevnetAccounts.length > 0
            ? availableDevnetAccounts.map((account, index) => {
              return (
                <option value={index} key={index}>
                  {`${getShortenedHash(
                    account.address ?? '',
                    6,
                    4
                  )} (${getRoundedNumber(
                    weiToEth(account.initial_balance),
                    2
                  )} ether)`}
                </option>
              )
            })
            : ([
              <option value={-1} key={-1}>
                No accounts found
              </option>
              ] as JSX.Element[])}
        </select>
        <div className="position-relative">
          <button
            className="btn"
            onClick={() => {
              copy(account?.address ?? '')
              setCopied(true)
              setTimeout(() => {
                setCopied(false)
              }, 1000)
            }}
          >
            <MdCopyAll />
          </button>
          {showCopied && (
            <p className="position-absolute text-copied">Copied</p>
          )}
        </div>
        <button
          className="btn refresh"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={refreshDevnetAccounts}
          title="Refresh devnet accounts"
          data-loading={accountRefreshing ? 'loading' : 'loaded'}
        >
          <MdRefresh />
        </button>
      </div>
    </div>
  )
}

export default DevnetAccountSelector
