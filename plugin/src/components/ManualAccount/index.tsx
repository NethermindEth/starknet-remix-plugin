/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useContext, useEffect, useState } from 'react'
import { Account, CallData, Provider, ec, hash, stark } from 'starknet'
import {
  networks as networkConstants,
  networkEquivalents,
  networkNameEquivalents
} from '../../utils/constants'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import { type BigNumberish, ethers } from 'ethers'
import { ManualAccount } from '../../types/accounts'

import ManualAccountContext from '../../contexts/ManualAccountContext'

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

  const { accounts, setAccounts, selectedAccount, setSelectedAccount, networkName, setNetworkName } = useContext(ManualAccountContext)

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
    if (selectedAccount === null) return
    const interval = setInterval(async () => {
      if ((account != null) && (provider != null)) {
        const resp = await provider.callContract({
          contractAddress: balanceContractAddress,
          entrypoint: 'balanceOf',
          calldata: [account.address]
        })
        setAccountBalance(resp.result[0])
      }
    }, 1000)
    return () => { clearInterval(interval) }
  }, [account, provider, accountDeployed])

  const createTestnetAccount = async (): Promise<void> => {
    setAccountAddressGenerated(false)
    // new Open Zeppelin account v0.5.1 :
    // Generate public and private key pair.
    const privateKey = stark.randomAddress()
    console.log('New OZ account :\nprivateKey=', privateKey)
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey)
    console.log('publicKey=', starkKeyPub)
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
    console.log('Precalculated account address=', OZcontractAddress)

    if (provider != null) { setAccount(new Account(provider, OZcontractAddress, privateKey)) }
    setAccountAddressGenerated(true)
  }

  function handleProviderChange (event: React.ChangeEvent<HTMLSelectElement>): void {
    const networkName = networkNameEquivalents.get(event.target.value)
    const chainId = networkEquivalents.get(event.target.value)
    setNetworkName(event.target.value)
    if ((event.target.value.length > 0) && chainId && networkName) {
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

  async function deployAccountHandler (): Promise<void> {
    setAccountDeploying(true)
    setAccountDeployed(false)
    if ((account == null) || (provider == null)) {
      // notify("No account selected");
      setAccountDeployed(true)
      setAccountDeploying(false)
      return
    }

    const OZaccountConstructorCallData = CallData.compile({
      publicKey: await account.signer.getPubKey()
    })

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { transaction_hash, contract_address } = await account.deployAccount({
      classHash: OZaccountClassHash,
      constructorCalldata: OZaccountConstructorCallData,
      addressSalt: await account.signer.getPubKey()
    })

    await provider.waitForTransaction(transaction_hash)
    console.log(
      '✅ New OpenZeppelin account created.\n   address =',
      contract_address
    )
    setAccountDeployed(true)
    setAccountDeploying(false)
  }

  return (
    <>
      {accountAddressGenerated
        ? (
        <div>
          {(account != null) && <p> Using address: {account.address}</p>}
          {(provider != null) && <p>Using provider: {networkName}</p>}
          {((account != null) && (provider != null)) && <p>Balance: {(ethers.utils.formatEther(accountBalance)).toString()} eth</p>}
        </div>
          )
        : (
        <form onSubmit={createTestnetAccount}>
          <select
            className="custom-select"
            aria-label=".form-select-sm example"
            onChange={handleProviderChange}
            defaultValue={networkConstants[0].value}
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
            type="submit"
          >
            createAccount
          </button>
        </form>
          )}
      {accountAddressGenerated && <button
        className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3"
        style={{
          cursor: `${
            accountDeployed || accountDeploying ? 'not-allowed' : 'pointer'
          }`
        }}
        disabled={accountDeployed || accountDeploying}
        aria-disabled={accountDeployed || accountDeploying}
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
          <p> DeployAccount </p>
            )}
      </button>}
    </>
  )
}

export default ManualAccount
