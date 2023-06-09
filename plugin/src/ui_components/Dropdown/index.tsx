import React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'

import './dropdown.css'

const Root = DropdownMenuPrimitive.Root

interface ITrigger {
  icon?: React.ReactNode
  children?: React.ReactNode
}
const IconTrigger: React.FC<ITrigger> = ({ icon, ...props }) => (
  <DropdownMenuPrimitive.Trigger asChild>
    <button className="IconButton" aria-label="Customise options" {...props}>
      {icon}
    </button>
  </DropdownMenuPrimitive.Trigger>
)
const Trigger: React.FC<ITrigger> = ({ children, ...props }) => (
  <DropdownMenuPrimitive.Trigger asChild {...props}>
    {children}
  </DropdownMenuPrimitive.Trigger>
)

const Portal = DropdownMenuPrimitive.Portal

interface IContent {
  children?: React.ReactNode
}
const Content: React.FC<IContent> = ({ children, ...props }) => (
  <DropdownMenuPrimitive.Content className="DropdownMenuContent" {...props}>
    {children}
  </DropdownMenuPrimitive.Content>
)

interface IItem {
  children: React.ReactNode
}
const Item: React.FC<IItem & DropdownMenuPrimitive.DropdownMenuItemProps> = ({
  children,
  ...props
}) => (
  <DropdownMenuPrimitive.Item className="DropdownMenuItem" {...props}>
    {children}
  </DropdownMenuPrimitive.Item>
)

const Sub = DropdownMenuPrimitive.Sub

interface ISubContent {
  children: React.ReactNode
}
const SubContent: React.FC<ISubContent> = ({ children, ...props }) => (
  <DropdownMenuPrimitive.SubContent
    className="DropdownMenuSubContent"
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.SubContent>
)

interface ISubTrigger {
  children: React.ReactNode
}
const SubTrigger: React.FC<ISubTrigger> = ({ children, ...props }) => (
  <DropdownMenuPrimitive.SubTrigger
    className="DropdownMenuSubTrigger"
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.SubTrigger>
)

const SubDivider = () => (
  <DropdownMenuPrimitive.Separator className="DropdownMenuSeparator" />
)

export {
  Root,
  Item,
  Portal,
  Content,
  Sub,
  SubContent,
  SubDivider,
  Trigger,
  IconTrigger,
  SubTrigger
}
