import React, { useEffect, useState } from 'react'
import { Account, CallData, RpcProvider, ec, hash, stark } from 'starknet'
import {
  type Network,
  networks as networkConstants,
  networkEquivalents
} from '../../utils/constants'
import { ethers } from 'ethers'

import storage from '../../utils/storage'

import './index.css'
import { BiCopy, BiPlus } from 'react-icons/bi'
import { getExplorerUrl, getShortenedHash, trimStr } from '../../utils/utils'
import { MdRefresh, MdCheckCircleOutline, MdCheck } from 'react-icons/md'
import copy from 'copy-to-clipboard'
import { useCurrentExplorer } from '../ExplorerSelector'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'

import transactionsAtom from '../../atoms/transactions'
import {
  accountAtom,
  networkAtom,
  selectedAccountAtom
} from '../../atoms/manualAccount'
import { envAtom } from '../../atoms/environment'
import useAccount from '../../hooks/useAccount'
import useProvider from '../../hooks/useProvider'
import useRemixClient from '../../hooks/useRemixClient'
import { getProvider } from '../../utils/misc'
import { declTxHashAtom, deployTxHashAtom } from '../../atoms/deployment'
import { invokeTxHashAtom } from '../../atoms/interaction'

import { BsChevronDown } from 'react-icons/bs'
import * as Select from '../ui_components/Select'

const ManualAccount: React.FC = () => {
  const OZaccountClassHash =
    '0x2794ce20e5f2ff0d40e632cb53845b9f4e526ebd8471983f7dbd355b721d5a'

  const balanceContractAddress =
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'

  const { account, setAccount } = useAccount()
  const { provider, setProvider } = useProvider()

  const setDeclTxHash = useSetAtom(declTxHashAtom)
  const setDeployTxHash = useSetAtom(deployTxHashAtom)
  const setInvokeTxHash = useSetAtom(invokeTxHashAtom)

  const [accountDeploying, setAccountDeploying] = useState(false)
  const [showCopied, setCopied] = useState(false)

  const { remixClient } = useRemixClient()

  const [transactions, setTransactions] = useAtom(transactionsAtom)

  const env = useAtomValue(envAtom)

  const [accounts, setAccounts] = useAtom(accountAtom)
  const [selectedAccount, setSelectedAccount] = useAtom(selectedAccountAtom)
  const [networkName, setNetworkName] = useAtom(networkAtom)

  useEffect(() => {
    setNetworkName(networkConstants[0].value)
  }, [setNetworkName])

  useEffect(() => {
    const prov = getProvider(networkName)
    setProvider(prov)
  }, [setProvider, networkName])

  useEffect(() => {
    const manualAccounts = storage.get('manualAccounts')
    if (
      manualAccounts != null &&
      accounts.length === 0 &&
      selectedAccount == null
    ) {
      const parsedAccounts = JSON.parse(manualAccounts)
      setAccounts(parsedAccounts)
    }
  })

  useEffect(() => {
    if (selectedAccount != null && account != null) {
      if (account.address === selectedAccount.address) return
      const accountExist = accounts.find(
        (acc) => acc.address === selectedAccount.address
      )
      if (accountExist != null) {
        if (provider != null) {
          setAccount(
            new Account(
              provider,
              selectedAccount.address,
              selectedAccount.private_key
            )
          )
          setDeclTxHash('')
          setDeployTxHash('')
          setInvokeTxHash('')
        }
      }
      return
    }
    if (accounts.length > 0) {
      setSelectedAccount(accounts[0])
      if (provider != null) {
        setAccount(
          new Account(provider, accounts[0].address, accounts[0].private_key)
        )
        setDeclTxHash('')
        setDeployTxHash('')
        setInvokeTxHash('')
      }
    } else {
      setSelectedAccount(null)
    }
  }, [accounts])

  const updateBalance = async (): Promise<void> => {
    if (account != null && provider != null && selectedAccount != null) {
      console.log(account, provider)
      const resp = await account.callContract({
        contractAddress: balanceContractAddress,
        entrypoint: 'balanceOf',
        calldata: [account.address]
      })
      console.log(resp)
      const balance = resp[0]
      const newAccount = { ...selectedAccount, balance }
      const newAccounts = accounts.map((acc) => {
        if (acc.address === selectedAccount.address) {
          return newAccount
        }
        return acc
      })
      setSelectedAccount(newAccount)
      setAccounts(newAccounts)
      setBalanceRefreshing(false)
      storage.set('manualAccounts', JSON.stringify(accounts))
    }
  }

  useEffect(() => {
    updateBalance().catch((err) => {
      console.log(err)
    })
  }, [account, provider])

  const createTestnetAccount = async (): Promise<void> => {
    const privateKey = stark.randomAddress()
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey)
    const OZaccountConstructorCallData = CallData.compile({
      publicKey: starkKeyPub
    })
    const OZcontractAddress = hash.calculateContractAddressFromHash(
      starkKeyPub,
      OZaccountClassHash,
      OZaccountConstructorCallData,
      0
    )
    const newAccounts = [
      ...accounts,
      {
        address: OZcontractAddress,
        private_key: privateKey,
        public_key: starkKeyPub,
        balance: 0,
        deployed_networks: []
      }
    ]
    setAccounts(newAccounts)
    storage.set('manualAccounts', JSON.stringify(newAccounts))
  }

  function handleProviderChange (
    networkName: string
  ): void {
    const chainId = networkEquivalents.get(networkName)
    if (chainId) {
      setNetworkName(networkName)
      setProvider(
        new RpcProvider({
          nodeUrl: networkName,
          chainId
        })
      )
      return
    }
    setProvider(null)
  }

  function handleAccountChange (
    accountIndex: number
  ): void {
    if (accountIndex === -1) return
    const selectedAccount = accounts[accountIndex]
    setSelectedAccount(selectedAccount)
    if (provider != null) {
      setAccount(
        new Account(
          provider,
          selectedAccount.address,
          selectedAccount.private_key
        )
      )
      setDeclTxHash('')
      setDeployTxHash('')
      setInvokeTxHash('')
    }
  }

  async function deployAccountHandler (): Promise<void> {
    if (account == null || provider == null || selectedAccount == null) {
      return
    }

    if (selectedAccount.deployed_networks.includes(networkName)) {
      await remixClient.call(
        'notification' as any,
        'toast',
        'ℹ️ Account already deployed on this network'
      )
      return
    }

    setAccountDeploying(true)

    try {
      const OZaccountConstructorCallData = CallData.compile({
        publicKey: await account.signer.getPubKey()
      })

      const {
        transaction_hash: transactionHash,
        contract_address: contractAddress
      } = await account.deployAccount({
        classHash: OZaccountClassHash,
        constructorCalldata: OZaccountConstructorCallData,
        addressSalt: await account.signer.getPubKey()
      })

      console.log('transaction_hash=', transactionHash)

      await provider.waitForTransaction(transactionHash)

      setTransactions([
        {
          type: 'deployAccount',
          account,
          provider,
          txId: transactionHash,
          env
        },
        ...transactions
      ])

      const newAccount = {
        ...selectedAccount,
        deployed_networks: [...selectedAccount.deployed_networks, networkName]
      }
      const newAccounts = accounts.map((acc) => {
        if (acc.address === selectedAccount.address) {
          return newAccount
        }
        return acc
      })
      setSelectedAccount(newAccount)
      setAccounts(newAccounts)
      storage.set('manualAccounts', JSON.stringify(newAccounts))
      console.log(
        '✅ New OpenZeppelin account created.\n   address =',
        contractAddress
      )
    } catch (e) {
      console.error(e)
      await remixClient.call(
        'notification' as any,
        'toast',
        '❌ Error while deploying account, check account balance'
      )
      if (e instanceof Error) {
        await remixClient.terminal.log({
          type: 'error',
          value: e.message
        })
      }
    }
    setAccountDeploying(false)
  }

  const [balanceRefreshing, setBalanceRefreshing] = useState(false)

  const explorerHook = useCurrentExplorer()

  return (
    <div className="manual-root-wrapper">
      <div className="network-selection-wrapper">
        <div className={'selector-wrapper'}>
          <Select.Root value={(selectedAccount != null) ? selectedAccount.address : ''} onValueChange={(value: string) => { handleAccountChange(accounts.findIndex(acc => acc.address === value)) }}>
          <div>
            <Select.Trigger>
              <div className="flex flex-row justify-content-space-between align-items-center p-0">
                <Select.Value placeholder='Select Account' >
                  {(selectedAccount != null) ? trimStr(selectedAccount.address, 6) : 'Select Account'}
                </Select.Value>
                <Select.Icon>
                  <div><BsChevronDown/></div>
                </Select.Icon>
              </div>
            </Select.Trigger>
          </div>
          <Select.Portal>
            <Select.Content>
              <Select.Viewport>
                {accounts.length > 0
                  ? (
                      accounts.map((account, index) => (
                        <Select.Item value={account.address} key={account.address}>
                          <Select.ItemText>
                            {trimStr(account.address, 6)}
                          </Select.ItemText>
                        </Select.Item>
                      ))
                    )
                  : (
                    <Select.Item value="no-account" key="no-account" disabled>
                      <Select.ItemText>
                        No account created yet
                      </Select.ItemText>
                    </Select.Item>
                    )}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
        </div>

        {/* <div></div> */}

        <button
          className="btn btn-secondary add-account-btn"
          onClick={(e) => {
            e.preventDefault()
            void createTestnetAccount()
          }}
        >
          <BiPlus />
        </button>
      </div>

      {selectedAccount != null && account != null && (
        <div className={'info-box-manual-account'}>
          <span className={'info-box-label'}>
            ADDRESS{' '}
          </span>
          <span className={'info-box-value'}>
            <a
                href={`${getExplorerUrl(
                    explorerHook.explorer,
                    networkName as Network
                )}/contract/${selectedAccount?.address}`}
                target="_blank"
                rel="noreferer noopener noreferrer"
            >
            {getShortenedHash(selectedAccount.address, 6, 4)}
          </a>
          </span>
            <button
                className="btn info-box-copy-btn"
                onClick={() => {
                  copy(selectedAccount.address)
                  setCopied(true)
                  setTimeout(() => {
                    setCopied(false)
                  }, 1000)
                }}
            >
              {showCopied ? <MdCheck /> : <BiCopy />}
            </button>
        </div>
      )}

      {selectedAccount != null && account != null && provider != null && (
        <div className="info-box-manual-account">
          <span className={'info-box-label'}>
            BALANCE{' '}
          </span>
          <span className={'info-box-value'}>
            {parseFloat(
              ethers.utils.formatEther(selectedAccount.balance)
            )?.toFixed(8)}{' '}
            ETH
          </span>
          <button
            className="btn info-box-copy-btn"
            data-refreshing={balanceRefreshing}
            onClick={(e) => {
              e.preventDefault()
              setBalanceRefreshing(true)
              updateBalance().catch((err) => {
                console.log(err)
              })
            }}
          >
            <MdRefresh />
          </button>
        </div>
      )}

      {selectedAccount != null && (networkName === 'goerli' || networkName === 'sepolia') && (
        <button
          className="btn btn-primary w-100-btn"
          onClick={() => {
            copy(selectedAccount?.address ?? '')
            remixClient
              .call(
                'notification' as any,
                'toast',
                'ℹ️ Address copied to Clipboard'
              )
              .catch((err) => {
                console.log(err)
              })
            setTimeout(() => {
              window?.open(
                `https://faucet.${networkName}.starknet.io/`,
                '_blank',
                'noopener noreferrer'
              )
            }, 2000)
          }}
        >
          Request funds on Starknet Faucet
        </button>
      )}

      <Select.Root value={networkName} onValueChange={(value: string) => { handleProviderChange(value) }}>
        <div className={'w-100-btn-x2'}>
          <Select.Trigger>
            <div className="flex flex-row justify-content-space-between align-items-center">
              <Select.Value>{networkName}</Select.Value>
              <Select.Icon>
                <BsChevronDown/>
              </Select.Icon>
            </div>
          </Select.Trigger>
        </div>
        <Select.Portal>
          <Select.Content>
            <Select.Viewport>
              {networkConstants.map((network) => (
                  <Select.Item value={network.value} key={network.name + '$' + network.value}>
                    <Select.ItemText>
                      {network.value}
                    </Select.ItemText>
                  </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      <button
        className="btn btn-primary btn-block d-block w-100-btn text-break remixui_disabled rounded"
        style={{
          cursor: `${
            (selectedAccount?.deployed_networks.includes(networkName) ??
              false) ||
            accountDeploying
              ? 'not-allowed'
              : 'pointer'
          }`
        }}
        disabled={
          (selectedAccount?.deployed_networks.includes(networkName) ?? false) ||
          accountDeploying
        }
        aria-disabled={
          (selectedAccount?.deployed_networks.includes(networkName) ?? false) ||
          accountDeploying
        }
        onClick={(e) => {
          e.preventDefault()
          void deployAccountHandler()
        }}
      >
        {accountDeploying
          ? (
          <>
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            />
            <span style={{ paddingLeft: '0.5rem' }}>Deploying Account...</span>
          </>
            )
          : selectedAccount?.deployed_networks.includes(networkName) ??
          false
            ? (
          <div className='account-deploy'>
            <MdCheckCircleOutline color="#0fd543" size={18} />
            <span style={{ paddingLeft: '0.5rem' }}>Account Deployed</span>
          </div>
              )
            : (
                'Deploy Account'
              )}
      </button>
    </div>
  )
}

export default ManualAccount
