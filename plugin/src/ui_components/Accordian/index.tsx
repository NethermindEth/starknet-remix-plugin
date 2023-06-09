import React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { BsChevronDown } from 'react-icons/bs'
import './accordian.css'

export interface IFCProps {
  children: React.ReactNode | null
}

export const AccordionTrigger = React.forwardRef<any, any>(
  ({ children, className, ...props }, forwardedRef) => (
    <AccordionPrimitive.Header className="AccordionHeader">
      <AccordionPrimitive.Trigger
        className={'AccordionTrigger'}
        {...props}
        ref={forwardedRef}
      >
        {children}
        <BsChevronDown className="AccordionChevron" aria-hidden />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
)

export const AccordionContent = React.forwardRef<any, any>(
  ({ children, className, ...props }, forwardedRef) => (
    <AccordionPrimitive.Content
      className={'AccordionContent'}
      {...props}
      ref={forwardedRef}
    >
      <div className="AccordionContentText">{children}</div>
    </AccordionPrimitive.Content>
  )
)

export const AccordianItem = AccordionPrimitive.Item

interface IAccordian {
  type: 'single' | 'multiple'
  defaultValue: any
  value?: any
  children: React.ReactNode
}
const Accordian: React.FC<IAccordian> = ({
  type = 'single',
  children,
  defaultValue,
  value
}) => (
  <AccordionPrimitive.Root
    className="AccordionRoot"
    type={type}
    value={value}
    defaultValue={defaultValue}
    collapsible={type === 'single'}
  >
    {children}
  </AccordionPrimitive.Root>
)

export default Accordian
