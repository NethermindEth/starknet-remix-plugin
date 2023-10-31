import { type ReactNode } from 'react'
import React from 'react'
import './card.css'

export interface CardProps {
  header?: string
  rightItem?: ReactNode
  children: ReactNode
}

export const Card: React.FC<CardProps> = ({ header, children, rightItem }) => {
  return (
    <div
      className="border-top border-bottom"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      {header !== undefined && (
        <div
          className="card-header card-header-i"
          style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
        >
          <h5 className="mb-0">{header}</h5>
          {rightItem}
        </div>
      )}
      <div
        className="card-body"
        style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
      >
        {children}
      </div>
    </div>
  )
}
