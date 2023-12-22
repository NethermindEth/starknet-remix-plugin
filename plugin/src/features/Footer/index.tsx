import React from 'react'
import Nethermind from '../../components/NM'
import './style.css'

const Footer: React.FC = () => {
  return (
    <div className="version-wrapper">
      <div></div>
      <div className="version-right">
        <label className="nethermind-powered">
          <span>Powered by: </span>
          <Nethermind size="xs" />
        </label>
      </div>
    </div>
  )
}

export default Footer
