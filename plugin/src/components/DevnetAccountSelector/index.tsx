import {
  getRoundedNumber,
  getShortenedHash,
  weiToEth
} from '../../utils/utils'
import { getAccounts } from '../../utils/network'
import React, { useEffect, useState } from 'react'
import { Account, RpcProvider } from 'starknet'
import { MdCopyAll, MdRefresh } from 'react-icons/md'
import './devnetAccountSelector.css'
import copy from 'copy-to-clipboard'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { availableDevnetAccountsAtom, devnetAtom, envAtom, isDevnetAliveAtom, selectedDevnetAccountAtom } from '../../atoms/environment'
import useAccount from '../../hooks/useAccount'
import useProvider from '../../hooks/useProvider'
import useRemixClient from '../../hooks/useRemixClient'
import * as D from '../../components/ui_components/Dropdown'
import { BsCheck, BsChevronDown } from 'react-icons/bs'
import { declTxHashAtom, deployTxHashAtom } from '../../atoms/deployment'
import { invokeTxHashAtom } from '../../atoms/interaction'

const DevnetAccountSelector: React.FC = () => {
  const { account, setAccount } = useAccount()
  const { provider, setProvider } = useProvider()
  const { remixClient } = useRemixClient()
  const env = useAtomValue(envAtom)
  const devnet = useAtomValue(devnetAtom)
  const [isDevnetAlive, setIsDevnetAlive] = useAtom(isDevnetAliveAtom)
  const [selectedDevnetAccount, setSelectedDevnetAccount] = useAtom(selectedDevnetAccountAtom)
  const [availableDevnetAccounts, setAvailableDevnetAccounts] = useAtom(availableDevnetAccountsAtom)

  const setDeclTxHash = useSetAtom(declTxHashAtom)
  const setDeployTxHash = useSetAtom(deployTxHashAtom)
  const setInvokeTxHash = useSetAtom(invokeTxHashAtom)

  const checkDevnetUrl = async (): Promise<void> => {
    try {
      const isKatanaEnv = (env === 'localKatanaDevnet')
      const response = await fetch(`${devnet.url}/${isKatanaEnv ? '' : 'is_alive'}`, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const status = await response.text()
      if (isKatanaEnv) {
        const jsonStatus: { health: boolean } = JSON.parse(status)
        if (jsonStatus.health) {
          setIsDevnetAlive(true)
        } else {
          setIsDevnetAlive(false)
        }
      } else if (status !== 'Alive!!!' || response.status !== 200) {
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
      const accounts = await getAccounts(devnet.url, (env === 'localKatanaDevnet'))
      if (
        JSON.stringify(accounts) !== JSON.stringify(availableDevnetAccounts)
      ) {
        if (accounts !== undefined) setAvailableDevnetAccounts(accounts)
        else setAvailableDevnetAccounts([])
      }
    } catch (e) {
      setAvailableDevnetAccounts([])
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
        setAvailableDevnetAccounts([])
        setAccount(null)
        setDeclTxHash('')
        setDeployTxHash('')
        setInvokeTxHash('')
        setSelectedDevnetAccount(null)
      } else {
        refreshDevnetAccounts().catch(e => {
          console.error(e)
        })
      }
    }, 1)
  }, [devnet, isDevnetAlive])

  useEffect(() => {
    if (
      !(
        selectedDevnetAccount !== null &&
        availableDevnetAccounts.includes(selectedDevnetAccount)
      ) &&
      (availableDevnetAccounts.length > 0)
    ) {
      setSelectedDevnetAccount(availableDevnetAccounts[0])
    }
  }, [availableDevnetAccounts, devnet])

  useEffect(() => {
    const newProvider = new RpcProvider({ nodeUrl: devnet.url })
    if (selectedDevnetAccount != null) {
      setAccount(
        new Account(
          newProvider,
          selectedDevnetAccount.address,
          selectedDevnetAccount.private_key
        )
      )
      setDeclTxHash('')
      setDeployTxHash('')
      setInvokeTxHash('')
    }
    setProvider(newProvider)
  }, [devnet, selectedDevnetAccount])

  function handleAccountChange (value: number): void {
    if (value === -1) {
      return
    }
    setAccountIdx(value)
    setSelectedDevnetAccount(availableDevnetAccounts[value])
    const newProvider = new RpcProvider({ nodeUrl: devnet.url })
    if (provider == null) setProvider(newProvider)
    setAccount(
      new Account(
        provider ?? newProvider,
        availableDevnetAccounts[value].address,
        availableDevnetAccounts[value].private_key
      )
    )
    setDeclTxHash('')
    setDeployTxHash('')
    setInvokeTxHash('')
  }

  const [accountRefreshing, setAccountRefreshing] = useState(false)
  const [showCopied, setCopied] = useState(false)

  const [accountIdx, setAccountIdx] = useState(0)

  useEffect(() => {
    setAccountIdx(0)
  }, [env])

  const [dropdownControl, setDropdownControl] = useState(false)

  return (
    <div className='mt-2'>
      <label className="">Devnet account selection</label>
      <div className="devnet-account-selector-wrapper">
        <D.Root open={dropdownControl} onOpenChange={(e) => { setDropdownControl(e) }}>
          <D.Trigger >
            <div className='flex flex-row justify-content-space-between align-items-center p-2 br-1 devnet-account-selector-trigger'>
              <label className='text-light text-sm m-0'>{(availableDevnetAccounts !== undefined && availableDevnetAccounts.length !== 0 && (availableDevnetAccounts[accountIdx]?.address) !== undefined)
                ? getShortenedHash(
                  availableDevnetAccounts[accountIdx]?.address,
                  6,
                  4
                )
                : 'No accounts found'}</label>
              <BsChevronDown style={{
                transform: dropdownControl ? 'rotate(180deg)' : 'none',
                transition: 'all 0.3s ease'
              }} />            </div>
          </D.Trigger>
          <D.Portal>
            <D.Content>
              {isDevnetAlive && (availableDevnetAccounts !== undefined && availableDevnetAccounts.length > 0)
                ? availableDevnetAccounts.map((account, index) => {
                  return (
                    <D.Item onClick={() => { handleAccountChange(index) }} key={index}>
                      {accountIdx === index && <BsCheck size={18} />}
                      {`${getShortenedHash(
                        account.address ?? '',
                        6,
                        4
                      )} (${getRoundedNumber(
                        weiToEth((env === 'localKatanaDevnet') ? account.balance : account.initial_balance),
                        2
                      )} ether)`}
                    </D.Item>
                  )
                })
                : ([
                  <D.Item onClick={() => { handleAccountChange(-1) }} key={-1}>
                    No accounts found
                  </D.Item>
                  ] as JSX.Element[])}
            </D.Content>
          </D.Portal>
        </D.Root>
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
