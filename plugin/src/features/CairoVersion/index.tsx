import * as D from '../../components/ui_components/Dropdown'
import React, { useEffect, useState } from 'react'
import { apiUrl } from '../../utils/network'
import { BsChevronDown } from 'react-icons/bs'
import Nethermind from '../../components/NM'
import cairoVersionAtom from '../../atoms/cairoVersion'
import './style.css'
import { useAtom } from 'jotai'
import useRemixClient from '../../hooks/useRemixClient'

const CairoVersion: React.FC = () => {
  const [cairoVersion, setCairoVersion] = useAtom(cairoVersionAtom)
  const { remixClient } = useRemixClient()

  const envViteVersion: string | undefined = import.meta.env.VITE_VERSION
  const pluginVersion = envViteVersion !== undefined ? `v${envViteVersion}` : 'v0.2.0'

  // Hard-coded versions for the example
  const [getVersions, setVersions] = useState([])

  useEffect(() => {
    const fetchCairoVersions = async (): Promise<void> => {
      try {
        if (apiUrl !== undefined) {
          const response = await fetch(
            `${apiUrl}/cairo_versions`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/octet-stream'
              },
              redirect: 'follow'
            }
          )
          const versions = JSON.parse(await response.text())
          setVersions(versions)
        }
      } catch (e) {
        await remixClient.call('notification' as any, 'toast', '🔴 Failed to fetch cairo versions from the compilation server')
        console.error(e)
        await remixClient.terminal.log(`🔴 Failed to fetch cairo versions from the compilation server ${e as string}` as any)
      }
    }

    setTimeout(() => {
      const fetchCairo = async (): Promise<void> => {
        await fetchCairoVersions()

        if (getVersions.length > 0) {
          setCairoVersion(getVersions[getVersions.length - 1])
        }
      }
      fetchCairo().catch(e => { console.error(e) })
    }, 10000)
  }, [remixClient])

  useEffect(() => {
    if (getVersions.length > 0) {
      setCairoVersion(getVersions[getVersions.length - 1])
    }
  }, [remixClient, getVersions])

  return (
    <div className="version-wrapper">
      <div>
        <D.Root>
          <D.Trigger>
            <label className="cairo-version-legend">
              Using Cairo {cairoVersion} <BsChevronDown />
            </label>
          </D.Trigger>
          <D.Portal>
            <D.Content>
              {getVersions.map((v, i) => (
                <D.Item
                  key={i}
                  onClick={() => {
                    setCairoVersion(v)
                  }}
                >
                  {v}
                </D.Item>
              ))}
            </D.Content>
          </D.Portal>
        </D.Root>
      </div>
      <div className="version-right">
        <label className="nethermind-powered">
          <span style={{ marginRight: '4px' }}>Powered by </span>
          <Nethermind size="xs" />
        </label>
        <label className="plugin-version">
          Plugin version: {pluginVersion}
        </label>
      </div>
    </div>
  )
}

export default CairoVersion
