import * as D from '../../ui_components/Dropdown'
import React, { useContext, useEffect, useState } from 'react'
import { apiUrl } from '../../utils/network'
import { RemixClientContext } from '../../contexts/RemixClientContext'
// import { BsChevronDown } from 'react-icons/bs'
import Nethermind from '../../components/NM'
import './style.css'

const CairoVersion: React.FC = () => {
  const [cairoVersion, setCairoVersion] = useState('v2.1.0-rc2')
  const remixClient = useContext(RemixClientContext)

  const [versions] = useState<string[]>([
    'v2.1.0-rc2'
  ])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const id = setTimeout(async () => {
      try {
        if (apiUrl !== undefined) {
          const response = await fetch(`${apiUrl}/cairo_version`, {
            method: 'GET',
            redirect: 'follow',
            headers: {
              'Content-Type': 'application/octet-stream'
            }
          })
          setCairoVersion(await response.text())
        }
      } catch (e) {
        await remixClient.call(
          'notification' as any,
          'toast',
          '🔴 Failed to fetch cairo version from the compilation server'
        )
        console.error(e)
      }
    }, 100)
    return () => {
      clearInterval(id)
    }
  }, [remixClient])

  return (
    <div className="version-wrapper">
      <div>
        <D.Root>
          <D.Trigger>
            <label className="cairo-version-legend">
              Using {cairoVersion} {/* <BsChevronDown /> */ }
            </label>
          </D.Trigger>
          <D.Portal>
            <D.Content>
              {versions.map((v, i) => {
                return (
                  <D.Item
                    key={i}
                    onClick={() => {
                      setCairoVersion(v)
                    }}
                  >
                    {v}
                  </D.Item>
                )
              })}
            </D.Content>
          </D.Portal>
        </D.Root>
      </div>

      <label className="cairo-version-legend">
        Powered by <Nethermind size="xs" />
      </label>
    </div>
  )
}

export default CairoVersion
