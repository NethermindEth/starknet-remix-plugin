import React from 'react'
import './settings.css'
import * as D from '../ui_components/Dropdown'
import { BsChevronDown } from 'react-icons/bs'
import { useAtom, useAtomValue } from 'jotai'
import { cairoVersionAtom, versionsAtom } from '../../atoms/cairoVersion'
import ExplorerSelector, { useCurrentExplorer } from '../ExplorerSelector'

export const Settings: React.FC = () => {
  const [cairoVersion, setCairoVersion] = useAtom(cairoVersionAtom)
  const getVersions = useAtomValue(versionsAtom)
  const explorerHook = useCurrentExplorer()

  return (
      <div className={'settings-wrapper'}>
        <div className={'text-center font-bold w-full'}>Settings</div>
        <div className={'settings-box'}>
          <div className={'settings-box-header'}>Cairo Version</div>
          <div className={'blank'}></div>
          <div className={'settings-box-content'}>
            <D.Root>
              <D.Trigger>
                <label className="flex flex-row justify-content-space-between align-items-center p-2 br-1 devnet-trigger-wrapper w-100">
                  Using Cairo {cairoVersion} <BsChevronDown/>
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
        </div>

        <div className={'settings-box'}>
          <div className={'settings-box-header'}>Explorer</div>
          <div className={'blank'}></div>
          <div className={'settings-box-content'}>
            <ExplorerSelector controlHook={explorerHook} isInline={false} isTextVisible={true}/>
          </div>
        </div>
      </div>
  )
}
