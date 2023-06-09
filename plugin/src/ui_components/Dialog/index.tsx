import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { RxCross2 } from 'react-icons/rx'
import './dialog.css'

const Root = Dialog.Root

const Trigger = Dialog.Trigger

const Portal = Dialog.Portal

const Overlay: React.FC<Dialog.DialogOverlayProps> = ({ ...props }) => (
  <Dialog.Overlay className="DialogOverlay" {...props} />
)

const Content: React.FC<Dialog.DialogContentProps> = ({
  children,
  ...props
}) => <Dialog.Content className="DialogContent">{children}</Dialog.Content>

const Close: React.FC<Dialog.DialogCloseProps> = ({ ...props }) => (
  <Dialog.Close className="DialogClose" {...props} >
    <RxCross2 />
  </Dialog.Close>
)

export { Root, Close, Content, Overlay, Portal, Trigger }
