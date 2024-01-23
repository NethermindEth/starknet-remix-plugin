import { nanoid } from 'nanoid'
import React from 'react'
import './style.css'

const Notices = [
  'The starknet Remix Plugin is in Alpha',
  'Cairo contracts and Scarb workspaces are compiled on a server hosted by Nethermind',
  'Declaration of contracts with some wallets will be supported when they update to the latest starknet.js version',
  'Sepolia support is experimental'
]

const BackgroundNotices: React.FC = () => {
  return (
    <div className='bg-transparent bg-notices-root'>
      <p className="text-center text-md bg-notices-text">Notices</p>
      {
        <ul className="list-group">
          {Notices.map((notice, index) => {
            return (
              <li key={nanoid()} className="list-group-item d-flex justify-content-left align-items-center bg-primary bg-notices-text">
                <span className="badge badge-information badge-pilled mr-2">
                  {index + 1}
                </span>
                {notice}
              </li>
            )
          })}
        </ul>
      }
    </div>
  )
}

export default BackgroundNotices
