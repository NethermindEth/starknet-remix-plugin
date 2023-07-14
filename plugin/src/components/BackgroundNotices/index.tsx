import React from 'react'

const Notices = [
  'The Starknet Remix Plugin is in alpha stage.',
  'Compilation only supports single, stand-alone files.',
  'Support for imports through Scarb is coming soon.'
]

const BackgroundNotices = () => {
  return (
    <div>
      <p className="text-center">Notices</p>
      {
        <ul className="list-group">
          {Notices.map((notice, index) => {
            return (
              <li className="list-group-item d-flex justify-content-left align-items-center disabled">
                <span className="badge badge-primary badge-pill mr-2">
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
