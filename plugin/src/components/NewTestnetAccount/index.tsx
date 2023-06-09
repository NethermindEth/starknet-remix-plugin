import React, { useState } from 'react'
import * as Dialog from '../../ui_components/Dialog'
import { AiOutlineClose } from 'react-icons/ai'
import './newTestnetAccount.css'
import { BsChevronDown } from 'react-icons/bs'
import * as D from '../../ui_components/Dropdown'
import Loader from '../../ui_components/CircularLoader'
import { BiCopy } from 'react-icons/bi'
import copy from 'copy-to-clipboard'
import { MdRefresh } from 'react-icons/md'

type INewTestNetAccount = {
  state: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

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
          className="devnet-account-refresh"
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

const NewTestNetAccount: React.FC<INewTestNetAccount> = ({ state }) => {
  const [isOpen, setOpen] = state
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
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <button
            className={'btn btn-danger p-1 rounded-circle close-btn'}
            onClick={() => setOpen(false)}
          >
            <AiOutlineClose size={'16px'} />
          </button>
          <section className="header-section">
            <h3>Create Account</h3>
          </section>
          {getCurrentStateView(currentState, setCurrentState)}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default NewTestNetAccount
