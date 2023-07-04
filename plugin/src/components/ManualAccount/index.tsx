/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useContext, useEffect, useState } from 'react'
import { Account, CallData, Provider, ec, hash, stark } from 'starknet'
import {
  networks as networkConstants,
  networkEquivalents,
  networkNameEquivalents
} from '../../utils/constants'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import { ethers } from 'ethers'

import ManualAccountContext from '../../contexts/ManualAccountContext'
import storage from '../../utils/storage'
import { RemixClientContext } from '../../contexts/RemixClientContext'
import TransactionContext from '../../contexts/TransactionContext'
import EnvironmentContext from '../../contexts/EnvironmentContext'

// TODOS: move state parts to contexts
// Account address selection
// network selection drop down

const ManualAccount: React.FC = () => {
  const OZaccountClassHash =
    '0x2794ce20e5f2ff0d40e632cb53845b9f4e526ebd8471983f7dbd355b721d5a'

  const balanceContractAddress =
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'

  const { account, provider, setAccount, setProvider } =
    useContext(ConnectionContext)

  const [accountDeploying, setAccountDeploying] = useState(false)

  const remixClient = useContext(RemixClientContext)

  const { transactions, setTransactions } = useContext(TransactionContext)

  const { env } = useContext(EnvironmentContext)

  const {
    accounts,
    setAccounts,
    selectedAccount,
    setSelectedAccount,
    networkName,
    setNetworkName
  } = useContext(ManualAccountContext)

  useEffect(() => {
    setNetworkName(networkConstants[0].value)
  }, [setNetworkName])

  useEffect(() => {
    const netName = networkNameEquivalents.get(networkName)
    const chainId = networkEquivalents.get(networkName)
    if (chainId && netName) {
      setProvider(
        new Provider({
          sequencer: { network: netName, chainId }
        })
      )
    }
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
    if (selectedAccount != null) return
    if (accounts.length > 0) {
      setSelectedAccount(accounts[0])
      if (provider != null) {
        setAccount(
          new Account(provider, accounts[0].address, accounts[0].private_key)
        )
      }
    } else {
      setSelectedAccount(null)
    }
  }, [accounts])

  const updateBalance = async (): Promise<void> => {
    if (account != null && provider != null && selectedAccount != null) {
      const resp = await provider.callContract({
        contractAddress: balanceContractAddress,
        entrypoint: 'balanceOf',
        calldata: [account.address]
      })
      const balance = resp.result[0]
      const newAccount = { ...selectedAccount, balance }
      const newAccounts = accounts.map((acc) => {
        if (acc.address === selectedAccount.address) {
          return newAccount
        }
        return acc
      })
      setSelectedAccount(newAccount)
      setAccounts(newAccounts)
      storage.set('manualAccounts', JSON.stringify(accounts))
    }
  }

  useEffect(() => {
    updateBalance().catch((err) => {
      console.log(err)
    })
  }, [account, provider])

  const createTestnetAccount = async (): Promise<void> => {
    // new Open Zeppelin account v0.5.1 :
    // Generate public and private key pair.
    const privateKey = stark.randomAddress()
    // console.log('New OZ account :\nprivateKey=', privateKey)
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey)
    // console.log('publicKey=', starkKeyPub)
    // Calculate future address of the account
    const OZaccountConstructorCallData = CallData.compile({
      publicKey: starkKeyPub
    })
    const OZcontractAddress = hash.calculateContractAddressFromHash(
      starkKeyPub,
      OZaccountClassHash,
      OZaccountConstructorCallData,
      0
    )
    // console.log('Precalculated account address=', OZcontractAddress)
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
    event: React.ChangeEvent<HTMLSelectElement>
  ): void {
    const networkName = networkNameEquivalents.get(event.target.value)
    const chainId = networkEquivalents.get(event.target.value)
    setNetworkName(event.target.value)
    if (event.target.value.length > 0 && chainId && networkName) {
      setProvider(
        new Provider({
          sequencer: {
            network: networkName,
            chainId
          }
        })
      )
      return
    }
    setProvider(null)
  }

  function handleAccountChange (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void {
    const accountIndex = parseInt(event.target.value)
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

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { transaction_hash, contract_address } =
        await account.deployAccount({
          classHash: OZaccountClassHash,
          constructorCalldata: OZaccountConstructorCallData,
          addressSalt: await account.signer.getPubKey()
        })

      await provider.waitForTransaction(transaction_hash)

      setTransactions([
        ...transactions,
        {
          type: 'deployAccount',
          account,
          provider,
          txId: transaction_hash,
          env
        }
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
        contract_address
      )
    } catch (e) {
      console.error(e)
      await remixClient.call(
        'notification' as any,
        'toast',
        '❌ Error while deploying account'
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

  return (
    <>
      <select
        className="custom-select"
        aria-label=".form-select-sm example"
        onChange={handleAccountChange}
        defaultValue={
          selectedAccount == null
            ? -1
            : accounts.findIndex(
              (acc) => acc.address === selectedAccount?.address
            )
        }
      >
        {accounts.length > 0
          ? (
              accounts.map((account, index) => {
                return (
              <option value={index} key={index}>
                {account.address}
              </option>
                )
              })
            )
          : (
          <option value={-1} key={-1}>
            No account created yet
          </option>
            )}
      </select>

      {selectedAccount != null && (
        <div>
          {account != null && <p> Using address: {selectedAccount.address}</p>}
          {account != null && provider != null && (
            <p>
              Balance:{' '}
              {ethers.utils.formatEther(selectedAccount.balance).toString()} eth
            </p>
          )}
          <button
            className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3"
            onClick={(e) => {
              e.preventDefault()
              void updateBalance()
            }}
          >
            <p> Update Balance </p>
          </button>
        </div>
      )}

      <button
        className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3"
        onClick={(e) => {
          e.preventDefault()
          void createTestnetAccount()
        }}
      >
        <p> Generate New Address </p>
      </button>
      <select
        className="custom-select"
        aria-label=".form-select-sm example"
        onChange={handleProviderChange}
        defaultValue={networkName}
      >
        {networkConstants.map((network) => {
          return (
            <option value={network.value} key={network.name}>
              {network.value}
            </option>
          )
        })}
      </select>
      <button
        className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3"
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
            >
              {' '}
            </span>
            <span style={{ paddingLeft: '0.5rem' }}>Deploying Account...</span>
          </>
            )
          : (
              (selectedAccount?.deployed_networks.includes(networkName) ?? false) ? <p> Account Deployed </p> : <p> DeployAccount </p>
            )}
      </button>
    </>
  )
}

export default ManualAccount
