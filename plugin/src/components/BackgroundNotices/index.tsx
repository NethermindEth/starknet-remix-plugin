import React from 'react'

const Notices = [
  'This is ALPHA Release for Starknet Remix Plugin.',
  'Currently only One file compilation is supported.',
  'Scarb Support will be present in the next version for this project'
]

const BackgroundNotices = () => {
  return (
    <div>
      <p className="text-center">Notices</p>
      {
        <ul className="list-group">
          {Notices.map((notice, index) => {
            return (
              <li className="list-group-item d-flex justify-content-between align-items-center disabled">
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
