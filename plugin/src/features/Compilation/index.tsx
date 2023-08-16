/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React, { useContext, useEffect } from 'react'
import { CompiledContractsContext } from '../../contexts/CompiledContractsContext'
import { RemixClientContext } from '../../contexts/RemixClientContext'
import { apiUrl } from '../../utils/network'
import {
  artifactFilename,
  artifactFolder,
  getFileExtension,
  getFileNameFromPath
} from '../../utils/utils'
import './styles.css'
import { hash } from 'starknet'
import Container from '../../ui_components/Container'
import storage from '../../utils/storage'
import { ethers } from 'ethers'
import CompilationContext from '../../contexts/CompilationContext'
import { type AccordianTabs } from '../Plugin'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CompilationProps {
  setAccordian: React.Dispatch<React.SetStateAction<AccordianTabs>>
}

const Compilation: React.FC<CompilationProps> = ({ setAccordian }) => {
  const remixClient = useContext(RemixClientContext)

  const { contracts, setContracts, setSelectedContract } =
    useContext(CompiledContractsContext)

  const {
    status,
    setStatus,
    currentFilename,
    setCurrentFilename,
    isCompiling,
    setIsCompiling,
    isValidCairo,
    setIsValidCairo,
    noFileSelected,
    setNoFileSelected,
    hashDir,
    setHashDir,
    tomlPaths,
    setTomlPaths
  } = useContext(CompilationContext)

  const [currWorkspacePath, setCurrWorkspacePath] = React.useState<string>('')

  useEffect(() => {
    // read hashDir from localStorage
    const hashDir = storage.get('hashDir')
    if (hashDir != null) {
      setHashDir(hashDir)
    } else {
      // create a random hash of length 32
      const hashDir = ethers.utils
        .hashMessage(ethers.utils.randomBytes(32))
        .replace('0x', '')
      setHashDir(hashDir)
      storage.set('hashDir', hashDir)
    }
  }, [hashDir])

  useEffect(() => {
    remixClient.on('fileManager', 'noFileSelected', () => {
      setNoFileSelected(true)
    })
  }, [remixClient])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      try {
        if (noFileSelected) {
          throw new Error('No file selected')
        }

        // get current file
        const currentFile = await remixClient.call(
          'fileManager',
          'getCurrentFile'
        )
        if (currentFile.length > 0) {
          const filename = getFileNameFromPath(currentFile)
          const currentFileExtension = getFileExtension(filename)
          setIsValidCairo(currentFileExtension === 'cairo')
          setCurrentFilename(filename)

          remixClient.emit('statusChanged', {
            key: 'succeed',
            type: 'info',
            title: 'Current file: ' + currentFilename
          })

          console.log('current File: ', currentFilename)
        }
      } catch (e) {
        remixClient.emit('statusChanged', {
          key: 'failed',
          type: 'info',
          title: 'Please open a cairo file to compile'
        })
        console.log('error: ', e)
      }
    }, 500)
  }, [remixClient, currentFilename, noFileSelected])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      remixClient.on(
        'fileManager',
        'currentFileChanged',
        (currentFileChanged: any) => {
          const filename = getFileNameFromPath(currentFileChanged)
          const currentFileExtension = getFileExtension(filename)
          setIsValidCairo(currentFileExtension === 'cairo')
          setCurrentFilename(filename)
          remixClient.emit('statusChanged', {
            key: 'succeed',
            type: 'info',
            title: 'Current file: ' + currentFilename
          })
          console.log('current File here: ', currentFilename)
          setNoFileSelected(false)
        }
      )
    }, 500)
  }, [remixClient, currentFilename])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      try {
        if (noFileSelected) {
          throw new Error('No file selected')
        }
        const currentFilePath = await remixClient.call(
          'fileManager',
          'getCurrentFile'
        )
        if (!currentFilePath.endsWith('.cairo')) {
          throw new Error('Not a valid cairo file')
        }
        const currentFileContent = await remixClient.call(
          'fileManager',
          'readFile',
          currentFilePath
        )
        await fetch(`${apiUrl}/save_code/${hashDir}/${currentFilePath}`, {
          method: 'POST',
          body: currentFileContent,
          redirect: 'follow',
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        })
      } catch (e) {
        remixClient.emit('statusChanged', {
          key: 'failed',
          type: 'info',
          title: 'Please open a cairo file to compile'
        })
        console.log('error: ', e)
      }
    }, 100)
  }, [currentFilename, remixClient])

  async function getTomlPaths (workspacePath: string, currPath: string): Promise<string[]> {
    console.log('currPath: ', workspacePath + '/' + currPath)

    const resTomlPaths: string[] = []

    try {
      const allFiles = await remixClient.fileManager.readdir(workspacePath + '/' + currPath)
      // get keys of allFiles object
      const allFilesKeys = Object.keys(allFiles)
      // const get all values of allFiles object
      const allFilesValues = Object.values(allFiles)

      for (let i = 0; i < allFilesKeys.length; i++) {
        console.log('allFilesValues[i]: ', allFilesValues[i], allFilesKeys[i])
        if (allFilesKeys[i].endsWith('Scarb.toml')) {
          resTomlPaths.push(currPath)
        }
        console.log('Object.values(allFilesValues[i])[0]', Object.values(allFilesValues[i])[0])
        if (Object.values(allFilesValues[i])[0]) {
          const recTomlPaths = await getTomlPaths(workspacePath, allFilesKeys[i])
          resTomlPaths.push(...recTomlPaths)
        }
      }
    } catch (e) {
      console.log('error: ', e)
    }
    return resTomlPaths
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      // get current workspace path
      try {
        const currWorkspace = await remixClient.filePanel.getCurrentWorkspace()
        setCurrWorkspacePath(currWorkspace.absolutePath)
      } catch (e) {
        console.log('error: ', e)
      }
    })
  })

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      // get current workspace path
      try {
        if (currWorkspacePath === '') return
        const allTomlPaths = await getTomlPaths(currWorkspacePath, '')
        console.log('allTomlPaths: ', allTomlPaths)
        setTomlPaths(allTomlPaths)
      } catch (e) {
        console.log('error: ', e)
      }
    }, 100)
  }, [currWorkspacePath])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      remixClient.on(
        'fileManager',
        'fileAdded',
        (_: any) => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          setTimeout(async () => {
            // get current workspace path
            try {
              console.log('Mc behen ke laude')
              const allTomlPaths = await getTomlPaths(currWorkspacePath, '')
              console.log('allTomlPaths: ', allTomlPaths)
              setTomlPaths(allTomlPaths)
            } catch (e) {
              console.log('error: ', e)
            }
          }, 100)
        }
      )
      remixClient.on(
        'fileManager',
        'folderAdded',
        (_: any) => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          setTimeout(async () => {
            // get current workspace path
            try {
              console.log('Mc behen ke laude')
              const allTomlPaths = await getTomlPaths(currWorkspacePath, '')
              console.log('allTomlPaths: ', allTomlPaths)
              setTomlPaths(allTomlPaths)
            } catch (e) {
              console.log('error: ', e)
            }
          }, 100)
        }
      )
      remixClient.on(
        'fileManager',
        'fileRemoved',
        (_: any) => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          setTimeout(async () => {
            // get current workspace path
            try {
              console.log('Mc behen ke laude')
              const allTomlPaths = await getTomlPaths(currWorkspacePath, '')
              console.log('allTomlPaths: ', allTomlPaths)
              setTomlPaths(allTomlPaths)
            } catch (e) {
              console.log('error: ', e)
            }
          }, 100)
        }
      )
      remixClient.on(
        'filePanel',
        'workspaceCreated',
        (_: any) => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          setTimeout(async () => {
            // get current workspace path
            try {
              console.log('Mc behen ke laude')
              const allTomlPaths = await getTomlPaths(currWorkspacePath, '')
              console.log('allTomlPaths: ', allTomlPaths)
              setTomlPaths(allTomlPaths)
            } catch (e) {
              console.log('error: ', e)
            }
          }, 100)
        }
      )
      remixClient.on(
        'filePanel',
        'workspaceRenamed',
        (_: any) => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          setTimeout(async () => {
            // get current workspace path
            try {
              console.log('Mc behen ke laude')
              const allTomlPaths = await getTomlPaths(currWorkspacePath, '')
              console.log('allTomlPaths: ', allTomlPaths)
              setTomlPaths(allTomlPaths)
            } catch (e) {
              console.log('error: ', e)
            }
          }, 100)
        }
      )
    }, 500)
  }, [remixClient])

  const compilations = [
    {
      header: 'Compile',
      validation: isValidCairo,
      isLoading: isCompiling,
      onClick: compile
    }
  ]

  async function compile (): Promise<void> {
    setIsCompiling(true)
    setStatus('Compiling...')
    // clear current file annotations: inline syntax error reporting
    await remixClient.editor.clearAnnotations()
    try {
      setStatus('Getting cairo file path...')
      const currentFilePath = await remixClient.call(
        'fileManager',
        'getCurrentFile'
      )

      setStatus('Getting cairo file content...')
      const currentFileContent = await remixClient.call(
        'fileManager',
        'readFile',
        currentFilePath
      )

      setStatus('Parsing cairo code...')
      let response = await fetch(
        `${apiUrl}/save_code/${hashDir}/${currentFilePath}`,
        {
          method: 'POST',
          body: currentFileContent,
          redirect: 'follow',
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        }
      )

      if (!response.ok) {
        await remixClient.call(
          'notification' as any,
          'toast',
          'Could not reach cairo compilation server'
        )
        throw new Error('Cairo Compilation Request Failed')
      }

      setStatus('Compiling to sierra...')
      response = await fetch(
        `${apiUrl}/compile-to-sierra/${hashDir}/${currentFilePath}`,
        {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain'
          }
        }
      )

      if (!response.ok) {
        await remixClient.call(
          'notification' as any,
          'toast',
          'Could not reach cairo compilation server'
        )
        throw new Error('Cairo Compilation Request Failed')
      }

      // get Json body from response
      const sierra = JSON.parse(await response.text())

      if (sierra.status !== 'Success') {
        setStatus('Reporting Errors...')
        await remixClient.terminal.log(sierra.message)

        const errorLets = sierra.message.trim().split('\n')

        // remove last element if it's starts with `Error:`
        if (errorLets[errorLets.length - 1].startsWith('Error:')) {
          errorLets.pop()
        }

        // break the errorLets in array of arrays with first element contains the string `Plugin diagnostic`
        const errorLetsArray = errorLets.reduce(
          (acc: any, curr: any) => {
            if (curr.startsWith('error:') || curr.startsWith('warning:')) {
              acc.push([curr])
            } else {
              acc[acc.length - 1].push(curr)
            }
            return acc
          },
          [['errors diagnostic:']]
        )

        // remove the first array
        errorLetsArray.shift()

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        errorLetsArray.forEach(async (errorLet: any) => {
          const errorType = errorLet[0].split(':')[0].trim()
          const errorTitle = errorLet[0].split(':').slice(1).join(':').trim()
          const errorLine = errorLet[1].split(':')[1].trim()
          const errorColumn = errorLet[1].split(':')[2].trim()
          // join the rest of the array
          const errorMsg = errorLet.slice(2).join('\n')

          console.log({
            row: Number(errorLine) - 1,
            column: Number(errorColumn) - 1,
            text: errorMsg + '\n' + errorTitle,
            type: errorType
          })

          await remixClient.editor.addAnnotation({
            row: Number(errorLine) - 1,
            column: Number(errorColumn) - 1,
            text: errorMsg + '\n' + errorTitle,
            type: errorType
          })
        })

        // trim sierra message to get last line
        const lastLine = sierra.message.trim().split('\n').pop().trim()

        remixClient.emit('statusChanged', {
          key: 'failed',
          type: 'error',
          title: lastLine.startsWith('Error') ? lastLine : 'Compilation Failed'
        })
        throw new Error(
          'Cairo Compilation Failed, logs can be read in the terminal log'
        )
      }

      setStatus('Compiling to casm...')

      response = await fetch(
        `${apiUrl}/compile-to-casm/${hashDir}/${currentFilePath.replace(
          getFileExtension(currentFilePath),
          'sierra'
        )}`,
        {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain'
          }
        }
      )

      if (!response.ok) {
        await remixClient.call(
          'notification' as any,
          'toast',
          'Could not reach cairo compilation server'
        )
        throw new Error('Cairo Compilation Request Failed')
      }

      // get Json body from response
      const casm = JSON.parse(await response.text())

      if (casm.status !== 'Success') {
        await remixClient.terminal.log(casm.message)

        const lastLine = casm.message.trim().split('\n').pop().trim()

        remixClient.emit('statusChanged', {
          key: 'failed',
          type: 'error',
          title: lastLine ?? 'Sierra Compilation Failed'
        })
        throw new Error(
          'Sierra Cairo Compilation Failed, logs can be read in the terminal log'
        )
      }

      await storeContract(
        currentFilename,
        currentFilePath,
        sierra.file_content,
        casm.file_content
      )

      setStatus('Saving artifacts...')

      const sierraPath = `${artifactFolder(currentFilePath)}/${artifactFilename(
        '.json',
        currentFilename
      )}`
      const casmPath = `${artifactFolder(currentFilePath)}/${artifactFilename(
        '.casm',
        currentFilename
      )}`

      remixClient.emit('statusChanged', {
        key: 'succeed',
        type: 'success',
        title: `Cheers : compilation successful, classHash: ${hash.computeContractClassHash(sierra.file_content)}`
      })

      try {
        await remixClient.call(
          'fileManager',
          'writeFile',
          sierraPath,
          sierra.file_content
        )
        await remixClient.call(
          'fileManager',
          'writeFile',
          casmPath,
          casm.file_content
        )
      } catch (e) {
        if (e instanceof Error) {
          await remixClient.call(
            'notification' as any,
            'toast',
            e.message +
              ' try deleting the files: ' +
              sierraPath +
              ' and ' +
              casmPath
          )
        }
        remixClient.emit('statusChanged', {
          key: 'succeed',
          type: 'warning',
          title: 'Failed to save artifacts'
        })
      }

      setStatus('Opening artifacts...')

      // await remixClient.fileManager.open(sierraPath)

      await remixClient.call(
        'notification' as any,
        'toast',
        `Cairo compilation output written to: ${sierraPath} `
      )
      setStatus('done')
    } catch (e) {
      setStatus('failed')
      if (e instanceof Error) {
        await remixClient.call('notification' as any, 'alert', {
          id: 'starknetRemixPluginAlert',
          title: 'Expectation Failed',
          message: e.message
        })
      }
      console.error(e)
    }
    setAccordian('deploy')
    setIsCompiling(false)
  }

  async function storeContract (
    contractName: string,
    path: string,
    sierraFile: string,
    casmFile: string
  ): Promise<void> {
    try {
      const sierra = await JSON.parse(sierraFile)
      const casm = await JSON.parse(casmFile)
      const compiledClassHash = hash.computeCompiledClassHash(casm)
      const classHash = hash.computeContractClassHash(sierra)
      const sierraClassHash = hash.computeSierraContractClassHash(sierra)
      if (contracts.find((contract) => contract.classHash === classHash && contract.compiledClassHash === compiledClassHash)) {
        return
      }
      const contract = {
        name: contractName,
        abi: sierra.abi,
        compiledClassHash,
        classHash,
        sierraClassHash,
        sierra,
        casm,
        path,
        deployedInfo: [],
        address: ''
      }
      setSelectedContract(contract)
      setContracts([...contracts, contract])
    } catch (e) {
      console.error(e)
    }
  }

  const compilationCard = (
    header: string,
    validation: boolean,
    isLoading: boolean,
    onClick: () => unknown
  ): React.ReactElement => {
    return (
      <Container>
        <div className="dropdown">
          <button className="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">Dropdown Example
          <span className="caret"></span></button>
          <ul className="dropdown-menu">
            <li>x</li>
            <li>y</li>
            <li>z</li>
          </ul>
        </div>
        <button
          className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-1 px-0"
          style={{
            cursor: `${
              !validation || !currentFilename ? 'not-allowed' : 'pointer'
            }`
          }}
          disabled={!validation || !currentFilename}
          aria-disabled={!validation || !currentFilename}
          onClick={onClick}
        >
          <div className="d-flex align-items-center justify-content-center">
            <div className="text-truncate overflow-hidden text-nowrap">
              {!validation
                ? (
                <span>Not a valid cairo file</span>
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
                        <span style={{ paddingLeft: '0.5rem' }}>{status}</span>
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

  return (
    <div>
      {compilations.map((compilation) => {
        return compilationCard(
          compilation.header,
          compilation.validation,
          compilation.isLoading,
          compilation.onClick
        )
      })}
    </div>
  )
}

export default Compilation
