import React from 'react'

import "./container.css";

type IContainer = {
    children?: React.ReactNode
}

const Container:React.FC<IContainer> = ({
    children
}) => {
  return (
    <div className='Container'>{children}</div>
  )
}

export default Container