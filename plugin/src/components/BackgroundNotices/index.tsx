import { nanoid } from 'nanoid'
import React from 'react'

const Notices = [
  'The starknet Remix Plugin is in Alpha',
  'Cairo contracts and Scarb workspaces are compiled on a server hosted by Nethermind',
  'Declaration of contracts with some wallets will be supported when they update to the latest starknet.js version'
]

const BackgroundNotices: React.FC = () => {
  return (
    <div className='bg-transparent'>
      <p className="text-center text-md text-light">Notices</p>
      {
        <ul className="list-group">
          {Notices.map((notice, index) => {
            return (
              <li key={nanoid()} className="list-group-item d-flex justify-content-left align-items-center text-disabled bg-primary">
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
