import React from 'react'
import * as Dialog from '../../ui_components/Dialog'
import { AiOutlineClose } from 'react-icons/ai'
import './newTestnetAccount.css'

type INewTestNetAccount = {
  state: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

const NewTestNetAccount: React.FC<INewTestNetAccount> = ({ state }) => {
  const [isOpen, setOpen] = state
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
          <p>Hey There It's a Dialog</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default NewTestNetAccount
