import {
  getRoundedNumber,
  getSelectedAccountIndex,
  getShortenedHash,
  weiToEth
} from '../../utils/utils'
import { getAccounts } from '../../utils/network'
import React, { useContext, useEffect, useState } from 'react'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import { Account, Provider } from 'starknet'
import { RemixClientContext } from '../../contexts/RemixClientContext'
import { MdRefresh } from 'react-icons/md'
import './devnetAccountSelector.css'
import EnvironmentContext from '../../contexts/EnvironmentContext'

const DevnetAccountSelector: React.FC = () => {
  const { setAccount, provider, setProvider } = useContext(ConnectionContext)
  const remixClient = useContext(RemixClientContext)

  const {
    devnet,
    isDevnetAlive,
    setIsDevnetAlive,
    selectedDevnetAccount,
    setSelectedDevnetAccount,
    availableDevnetAccounts,
    setAvailableDevnetAccounts
  } = useContext(EnvironmentContext)

  // devnet live status
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const interval = setInterval(async () => {
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
          setIsDevnetAlive(() => false)
        } else {
          setIsDevnetAlive(() => true)
        }
      } catch (error) {
        setIsDevnetAlive(() => false)
      }
    }, 1000)
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
      console.log(e)
    }
  }

  useEffect(() => {
    if (!isDevnetAlive) {
      notifyDevnetStatus().catch((e) => {
        console.log(e)
      })
    }
  }, [isDevnetAlive])

  const refreshDevnetAccounts = async (): Promise<void> => {
    setAccountRefreshing(true)
    try {
      const accounts = await getAccounts(devnet.url)
      if (JSON.stringify(accounts) !== JSON.stringify(availableDevnetAccounts)) {
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
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      if (!isDevnetAlive) {
        return
      }
      await refreshDevnetAccounts()
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
    setProvider(
      new Provider({
        sequencer: {
          baseUrl: devnet.url
        }
      })
    )
    if (provider != null && selectedDevnetAccount != null) {
      setAccount(
        new Account(
          provider,
          selectedDevnetAccount.address,
          selectedDevnetAccount.private_key
        )
      )
    }
  }, [devnet, selectedDevnetAccount])

  function handleAccountChange (event: any): void {
    if (event.target.value === -1) {
      return
    }
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

  return (
    <>
      <label className="">Devnet account selection</label>
      <div className="devnet-account-selector-wrapper">
        <select
          className="custom-select"
          aria-label=".form-select-sm example"
          onChange={handleAccountChange}
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
        <button
          className="refresh"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={async () => {
            await refreshDevnetAccounts()
          }}
          title="Refresh devnet accounts"
          data-loading={accountRefreshing ? 'loading' : 'loaded'}
        >
          <MdRefresh />
        </button>
      </div>
    </>
  )
}

export default DevnetAccountSelector
