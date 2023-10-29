import React from 'react'

import './container.css'

interface IContainer {
  children?: React.ReactNode
}

const Container: React.FC<IContainer> = ({ children }) => {
  return <div className="p-2">{children}</div>
}

export default Container
