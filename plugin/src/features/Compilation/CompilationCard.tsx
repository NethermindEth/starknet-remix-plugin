import React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { BsChevronDown } from 'react-icons/bs'
import { compilationAtom, activeTomlPathAtom, statusAtom } from '../../atoms/compilation'
import Container from '../../components/ui_components/Container'
import useRemixClient from '../../hooks/useRemixClient'
import { isEmpty } from '../../utils/misc'

import * as D from '../../components/ui_components/Dropdown'

const CompilationCard: React.FC<{
  validation: boolean
  isLoading: boolean
  onClick: () => unknown
  compileScarb: (workspacePath: string, scarbPath: string) => Promise<void>
  currentWorkspacePath: string
}> = (
  {
    validation,
    isLoading,
    onClick,
    compileScarb,
    currentWorkspacePath
  }
): React.ReactElement => {
  const { remixClient } = useRemixClient()

  const {
    activeTomlPath,
    tomlPaths,
    isCompiling,
    currentFilename
  } = useAtomValue(compilationAtom)

  const setActiveTomlPath = useSetAtom(activeTomlPathAtom)

  const isCurrentFileName = isEmpty(currentFilename)

  return (
        <Container>
          {activeTomlPath !== undefined && tomlPaths?.length > 0 && (
            <div className="project-dropdown-wrapper d-flex flex-column mb-3">
              <button
                className="btn btn-warning w-100 text-break mb-1 mt-1 px-0"
                disabled={isCompiling}
                aria-disabled={isCompiling}
                onClick={() => {
                  compileScarb(currentWorkspacePath, activeTomlPath).then(() => {
                    remixClient.emit('statusChanged', {
                      key: 'succeed',
                      type: 'success',
                      title: 'Cheers : compilation successful'
                    })
                  }).catch(e => {
                    console.log('error: ', e)
                  })
                }}
              >
                Compile Project
              </button>

              <D.Root>
                <D.Trigger>
                  <div className="btn btn-primary w-100 trigger-wrapper px-0">
                    <label className="text-break text-white" style={{ fontFamily: 'inherit', fontSize: 'inherit' }}>
                      {activeTomlPath}
                    </label>
                    <BsChevronDown />
                  </div>
                </D.Trigger>
                <D.Portal>
                  <D.Content>
                    {tomlPaths.map((tomlPath, i) => {
                      return (
                        <D.Item
                          key={i.toString() + tomlPath}
                          onClick={() => {
                            setActiveTomlPath(tomlPath)
                          }}
                        >
                          {tomlPath}
                        </D.Item>
                      )
                    })}
                  </D.Content>
                </D.Portal>
              </D.Root>
              <div className='mx-auto'>Or compile a single file:</div>
            </div>
          )}
          <button
            className="btn btn-information btn-block d-block w-100 text-break remixui_disabled mb-1 mt-1 px-0"
            style={{
              cursor: `${(!validation || isCurrentFileName) ? 'not-allowed' : 'pointer'
                }`
            }}
            disabled={!validation || isCurrentFileName || isCompiling}
            aria-disabled={!validation || isCurrentFileName || isCompiling}
            onClick={onClick}
          >
            <div className="d-flex align-items-center justify-content-center">
              <div className="text-truncate overflow-hidden text-nowrap">
                {!validation
                  ? (
                    <span>Select a valid cairo file</span>
                    )
                  : (
                    <>
                      <div className="d-flex align-items-center justify-content-center">
                        {isLoading
                          ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                              >
                                {' '}
                              </span>
                              <span style={{ paddingLeft: '0.5rem' }}>{ useAtomValue(statusAtom)}</span>
                            </>
                            )
                          : (
                            <div className="text-truncate overflow-hidden text-nowrap">
                              <span>Compile</span>
                              <span className="ml-1 text-nowrap">
                                {currentFilename}
                              </span>
                            </div>
                            )}
                      </div>
                    </>
                    )}
              </div>
            </div>
          </button>
        </Container>
  )
}

export default CompilationCard
