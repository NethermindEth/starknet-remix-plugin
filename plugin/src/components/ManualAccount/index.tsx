import { useContext, useEffect, useState } from 'react'
import { Account, CallData, Provider, ec, hash, stark } from 'starknet'
import {
  networks as networkConstants,
  networkEquivalents,
  networkNameEquivalents
} from '../../utils/constants'
import { ConnectionContext } from '../../contexts/ConnectionContext'
import { BigNumberish, ethers } from 'ethers'

import * as D from '../../ui_components/Dropdown'
import Loader from '../../ui_components/CircularLoader'
import { BiCopy } from 'react-icons/bi'
import copy from 'copy-to-clipboard'
import { MdRefresh } from 'react-icons/md'
import { BsChevronDown } from 'react-icons/bs'
import './manualAccount.css'

type AccountCreationState = 'selectNetwork' | 'created' | 'loading'
type Networks = 'goerli' | 'dev-goerli'

type IStepProps = {
  changeState: React.Dispatch<React.SetStateAction<AccountCreationState>>
}

const SelectNetworkState: React.FC<IStepProps> = ({ changeState }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<Networks>('goerli')
  const networks: Networks[] = ['goerli', 'dev-goerli']
  const handleCreateAccount = () => {
    changeState('loading')
    // DUMMY LOAD BELOW
    setTimeout(() => {
      changeState('created')
    }, 3000)
  }
  return (
    <div>
      <div className="select-account-creation-network-wrapper">
        <p>Select Network</p>
        <D.Root>
          <D.Trigger>
            <label className="select-account-creation-network">
              {selectedNetwork} <BsChevronDown />
            </label>
          </D.Trigger>
          <D.Portal>
            <D.Content>
              {networks.map((v, i) => {
                return (
                  <D.Item
                    key={i}
                    onClick={() => {
                      setSelectedNetwork(v)
                    }}
                  >
                    {v}
                  </D.Item>
                )
              })}
            </D.Content>
          </D.Portal>
        </D.Root>
      </div>
      <button
        className="btn btn-secondary rounded-pill"
        onClick={handleCreateAccount}
      >
        Create Testnet Account
      </button>
    </div>
  )
}

type IAccountCreated = IStepProps & {
  account: string
}

const AccountCreated: React.FC<IAccountCreated> = ({
  account,
  changeState
}) => {
  const [showCopied, setShowCopied] = useState(false)

  const [balanceRefreshing, setBalanceRefreshing] = useState(false)
  const [balance, setBalance] = useState('0.005')
  return (
    <div>
      <div className="account-address-wrapper">
        <label className="account-label">Account Address: </label>
        <span>
          <p className="account-address">{account}</p>
          <button
            className="btn btn-primary rounded-circle d-flex justify-content-center align-items-center"
            onClick={() => {
              setShowCopied(true)
              copy(account)
              setTimeout(() => {
                setShowCopied(false)
              }, 1000)
            }}
          >
            <BiCopy />
            {showCopied && (
              <span className="btn btn-secondary copied-text">Copied</span>
            )}
          </button>
        </span>
      </div>
      <div className="d-flex align-items-center pb-2 balance-wrapper">
        <p>Balance: </p>
        <p>{balance} ETH</p>
        <button
          className="refresh"
          onClick={() => {
            setBalanceRefreshing(true)
            // ONLY DEBUG CODE REMOVE WHILE USING
            setTimeout(() => {
              setBalanceRefreshing(false)
            }, 3000)
          }}
          data-loading={balanceRefreshing ? 'loading' : 'loaded'}
        >
          <MdRefresh />
        </button>
      </div>
      <button
        onClick={() => changeState('selectNetwork')}
        className="btn btn-danger"
      >
        Reset
      </button>
    </div>
  )
}

interface ManualAccountProps {}

function ManualAccount(props: ManualAccountProps) {
  const OZaccountClassHash =
    '0x2794ce20e5f2ff0d40e632cb53845b9f4e526ebd8471983f7dbd355b721d5a'

  const balanceContractAddress =
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'

  const { account, provider, setAccount, setProvider } =
    useContext(ConnectionContext)

  const [accountAddressGenerated, setAccountAddressGenerated] =
    useState<boolean>(false)
  const [accountDeployed, setAccountDeployed] = useState<boolean>(false)
  const [accountDeploying, setAccountDeploying] = useState<boolean>(false)
  const [accountBalance, setAccountBalance] = useState<BigNumberish>(0x0)

  const [networkName, setNetworkName] = useState<string>(
    networkConstants[0].value
  )

  useEffect(() => {
    console.log('networkConstants=', networkConstants[0].value)
    setNetworkName(networkConstants[0].value)
  }, [setNetworkName])

  useEffect(() => {
    const netName = networkNameEquivalents.get(networkName)
    const chainId = networkEquivalents.get(networkName)
    console.log('chain=', chainId, 'net=', netName, networkName)
    if (chainId && netName)
      setProvider(
        new Provider({
          sequencer: { network: netName, chainId: chainId }
        })
      )
  }, [setProvider, networkName])

  useEffect(() => {
    const interval = setInterval(async () => {
      //   console.log("fecthing balanceOf...");
      if (account && provider) {
        const resp = await provider.callContract({
          contractAddress: balanceContractAddress,
          entrypoint: 'balanceOf',
          calldata: [account.address]
        })
        // console.log("balanceOf=", resp);
        // convert resp[0] as hex string to decimal number
        setAccountBalance(resp.result[0])
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [account, provider, accountDeployed])

  const createTestnetAccount = async () => {
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

    if (provider)
      setAccount(new Account(provider, OZcontractAddress, privateKey))
    setAccountAddressGenerated(true)
  }

  function handleProviderChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const networkName = networkNameEquivalents.get(event.target.value)
    const chainId = networkEquivalents.get(event.target.value)
    setNetworkName(event.target.value)
    if (event.target.value && chainId && networkName) {
      setProvider(
        new Provider({
          sequencer: {
            network: networkName,
            chainId: chainId
          }
        })
      )
      return
    }
    setProvider(null)
  }

  async function deployAccountHandler() {
    setAccountDeploying(true)
    setAccountDeployed(false)
    if (!account || !provider) {
      // notify("No account selected");
      setAccountDeployed(true)
      setAccountDeploying(false)
      return
    }

    const OZaccountConstructorCallData = CallData.compile({
      publicKey: await account.signer.getPubKey()
    })

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

  const [currentState, setCurrentState] =
    useState<AccountCreationState>('selectNetwork')

  const getCurrentStateView = (
    state: AccountCreationState,
    setCurrentState: React.Dispatch<React.SetStateAction<AccountCreationState>>
  ) => {
    switch (state) {
      case 'created':
        return (
          <AccountCreated
            account="0x0551F5727597bE4Ceb967c464835010DF9000C3a75df64b59948bE58517c9aF3"
            changeState={setCurrentState}
          />
        )
      case 'selectNetwork':
        return <SelectNetworkState changeState={setCurrentState} />
      case 'loading':
        return (
          <div className="account-state-loader-wrapper">
            <Loader />
            <p>Creating Account</p>
          </div>
        )
      default:
        throw new Error('Invlalid state')
    }
  }

  return (
    <>
      {accountAddressGenerated ? (
        <div>
          {account && <p> Using address: {account.address}</p>}
          {provider && <p>Using provider: {networkName}</p>}
          {account && provider && (
            <p>
              Balance: {ethers.utils.formatEther(accountBalance).toString()} eth
            </p>
          )}
        </div>
      ) : (
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
      <button
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
          deployAccountHandler()
        }}
      >
        {accountDeploying ? (
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
        ) : (
          <p> DeployAccount </p>
        )}
      </button>

      {getCurrentStateView(currentState, setCurrentState)}
    </>
  )
}

export default ManualAccount
