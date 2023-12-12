/* eslint-disable multiline-ternary */
import React, { useEffect } from 'react'
import { apiUrl } from '../../utils/network'
import {
  artifactFilename,
  artifactFolder,
  getFileExtension
} from '../../utils/utils'
import './styles.css'
import { hash } from 'starknet'
import storage from '../../utils/storage'
import { ethers } from 'ethers'
import { type AccordianTabs } from '../Plugin'
import { type Contract } from '../../utils/types/contracts'
import { asyncFetch } from '../../utils/async_fetch'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'

// Imported Atoms
import cairoVersionAtom from '../../atoms/cairoVersion'
import {
  compiledContractsAtom,
  selectedCompiledContract
} from '../../atoms/compiledContracts'
import {
  activeTomlPathAtom,
  compilationAtom,
  hashDirAtom,
  isCompilingAtom,
  statusAtom
} from '../../atoms/compilation'
import useRemixClient from '../../hooks/useRemixClient'
import { isEmpty } from '../../utils/misc'
import CompilationCard from './CompilationCard'

interface FileContentMap {
  file_name: string
  file_content: string
}

interface ScarbCompileResponse {
  status: string
  message: string
  file_content_map_array: FileContentMap[]
}

interface CompileResponse {
  status: string
  message: string
  file_content: string
  cairo_version: string
}

interface CompilationProps {
  setAccordian: React.Dispatch<React.SetStateAction<AccordianTabs>>
}

const Compilation: React.FC<CompilationProps> = ({ setAccordian }) => {
  const {
    remixClient,
    currentFilePath,
    currWorkspacePath,
    writeFileContent,
    getCurrentFileContent,
    showNotification
  } = useRemixClient()
  const cairoVersion = useAtomValue(cairoVersionAtom)

  const [contracts, setContracts] = useAtom(compiledContractsAtom)
  const [selectedContract, setSelectedContract] = useAtom(
    selectedCompiledContract
  )

  const {
    currentFilename,
    isCompiling,
    isValidCairo,
    noFileSelected,
    hashDir,
    tomlPaths,
    activeTomlPath
  } = useAtomValue(compilationAtom)

  const setStatus = useSetAtom(statusAtom)
  const setHashDir = useSetAtom(hashDirAtom)
  const setIsCompiling = useSetAtom(isCompilingAtom)
  const setActiveTomlPath = useSetAtom(activeTomlPathAtom)

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
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      try {
        if (noFileSelected) {
          throw new Error('No file selected')
        }

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

  useEffect(() => {
    if (activeTomlPath === '' || activeTomlPath === undefined) {
      setActiveTomlPath(tomlPaths[0])
    }
  }, [tomlPaths])

  const compilations = [
    {
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
      setStatus('Getting cairo file content...')
      const currentFileContent = await getCurrentFileContent()

      setStatus('Parsing cairo code...')
      const saveCodeResponse = await fetch(
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

      if (!saveCodeResponse.ok) {
        await remixClient.call(
          'notification' as any,
          'toast',
          'Could not reach cairo compilation server'
        )
        throw new Error('Cairo Compilation Request Failed')
      }

      setStatus('Compiling to sierra...')

      const compileToSierraResponse = await asyncFetch(
        `compile-to-sierra-async/${cairoVersion}/${hashDir}/${currentFilePath}`,
        'compile-to-sierra-result'
      )

      // get Json body from response
      const sierra = JSON.parse(compileToSierraResponse)

      if (sierra.status !== 'Success') {
        setStatus('Reporting Errors...')
        await remixClient.terminal.log(sierra.message)

        const errorLets: string[] = sierra.message.trim().split('\n')

        // remove last element if it's starts with `Error:`
        if (errorLets[errorLets.length - 1].startsWith('Error:')) {
          errorLets.pop()
        }

        // break the errorLets in array of arrays with first element contains the string `Plugin diagnostic`
        const errorLetsArray = errorLets.reduce(
          (acc: string[][], curr: string) => {
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
          const errorTitle: string = errorLet[0]
            .split(':')
            .slice(1)
            .join(':')
            .trim()
          const errorLine = errorLet[1].split(':')[1].trim()
          const errorColumn = errorLet[1].split(':')[2].trim()
          // join the rest of the array
          const errorMsg: string = errorLet.slice(2).join('\n')

          await remixClient.editor.addAnnotation({
            row: Number(errorLine) - 1,
            column: Number(errorColumn) - 1,
            text: errorMsg + '\n' + errorTitle,
            type: errorType
          })
        })

        // trim sierra message to get last line
        const lastLine: string = sierra.message.trim().split('\n').pop().trim()

        remixClient.emit('statusChanged', {
          key: 'failed',
          type: 'error',
          title: lastLine?.startsWith('Error') ? lastLine : 'Compilation Failed'
        })
        throw new Error(
          'Cairo Compilation Failed, logs can be read in the terminal log'
        )
      }
      setStatus('Compiling to casm...')

      const compileToCasmResponse = await asyncFetch(
        `compile-to-casm-async/${cairoVersion}/${hashDir}/${currentFilePath.replaceAll(
          getFileExtension(currentFilePath),
          'sierra'
        )}`,
        'compile-to-casm-result'
      )

      // get Json body from response
      const casm: CompileResponse = JSON.parse(compileToCasmResponse)
      if (casm.status !== 'Success') {
        await remixClient.terminal.log(casm.message as unknown as any)

        const lastLine = casm.message.trim().split('\n').pop()?.trim()

        remixClient.emit('statusChanged', {
          key: 'failed',
          type: 'error',
          title: lastLine ?? 'Sierra Compilation Failed'
        })
        throw new Error(
          'Sierra Cairo Compilation Failed, logs can be read in the terminal log'
        )
      }

      const contract = await genContractData(
        currentFilename,
        currentFilePath,
        sierra.file_content,
        casm.file_content
      )

      if (contract != null) {
        setSelectedContract(contract)
        setContracts([...contracts, contract])
      } else {
        if (selectedContract == null) setSelectedContract(contracts[0])
      }

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
        title: `Cheers : compilation successful, classHash: ${hash.computeContractClassHash(
          sierra.file_content
        )}`
      })

      try {
        await writeFileContent(sierraPath, sierra.file_content)
        await writeFileContent(casmPath, casm.file_content)
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

      await showNotification(
        `Cairo compilation output written to: ${sierraPath} `
      )

      setStatus('done')
      setAccordian('deploy')
    } catch (e) {
      setStatus('failed')
      if (e instanceof Error) {
        await remixClient.call('notification' as any, 'alert', {
          id: 'starknetRemixPluginAlert',
          title: 'Cairo Compilation Failed',
          message: e.message
        })
      }
      console.error(e)
    }
    setIsCompiling(false)
  }

  async function saveScarbWorkspace (
    workspacePath: string,
    currPath: string
  ): Promise<string[]> {
    const resTomlPaths: string[] = []

    try {
      const allFiles = await remixClient.fileManager.readdir(
        workspacePath + '/' + currPath
      )
      // get keys of allFiles object
      const allFilesKeys = Object.keys(allFiles)
      // const get all values of allFiles object
      const allFilesValues = Object.values(allFiles)

      for (let i = 0; i < allFilesKeys.length; i++) {
        if (
          allFilesKeys[i].endsWith('Scarb.toml') ||
          allFilesKeys[i].endsWith('.cairo')
        ) {
          const fileContent = await remixClient.call(
            'fileManager',
            'readFile',
            workspacePath + '/' + allFilesKeys[i]
          )
          setStatus(`Saving ${allFilesKeys[i]}...`)
          const response = await fetch(
            `${apiUrl}/save_code/${hashDir}/${
              workspacePath.replace('.', '') + '/' + allFilesKeys[i]
            }`,
            {
              method: 'POST',
              body: fileContent,
              redirect: 'follow',
              headers: {
                'Content-Type': 'application/octet-stream'
              }
            }
          )
          if (!response.ok) {
            await showNotification('Could not reach cairo compilation server')
            throw new Error('Cairo Compilation Request Failed')
          }
        }
        const checkVal = Object.values(allFilesValues[i])[0]
        if (!isEmpty(checkVal)) {
          await saveScarbWorkspace(workspacePath, allFilesKeys[i])
        }
      }
    } catch (e) {
      console.log('error: ', e)
    }
    return resTomlPaths
  }

  async function compileScarb (
    workspacePath: string,
    scarbPath: string
  ): Promise<void> {
    setIsCompiling(true)
    try {
      setStatus('Saving scarb workspace...')
      await saveScarbWorkspace(workspacePath, scarbPath)

      let result: string
      try {
        result = await asyncFetch(
          `compile-scarb-async/${hashDir}/${workspacePath.replace(
            '.',
            ''
          )}/${scarbPath}`,
          'compile-scarb-result'
        )
      } catch (e) {
        await showNotification('Could not reach cairo compilation server')
        throw new Error('Cairo Compilation Request Failed')
      }
      const scarbCompile: ScarbCompileResponse = JSON.parse(result)
      if (scarbCompile.status !== 'Success') {
        await showNotification(
          {
            id: 'starknetRemixPluginAlert',
            title: 'Scarb compilation failed!',
            message:
              'Scarb compilation failed!, you can read logs in the terminal console'
          },
          'alert'
        )
        remixClient.emit('statusChanged', {
          key: 'failed',
          type: 'error',
          title: 'Scarb compilation failed!'
        })
        await remixClient.terminal.log({
          type: 'error',
          value: scarbCompile.message
        })
        throw new Error('Cairo Compilation Request Failed')
      }

      remixClient.emit('statusChanged', {
        key: 'succeed',
        type: 'success',
        title: 'Scarb compilation successful'
      })

      setStatus('Analyzing contracts...')

      let notifyCasmInclusion = false

      const contractsToStore: Contract[] = []

      console.log(scarbCompile.file_content_map_array)

      for (const file of scarbCompile.file_content_map_array) {
        if (file.file_name?.endsWith('.contract_class.json')) {
          const contractName: string = file.file_name.replace(
            '.contract_class.json',
            ''
          )
          const sierra = JSON.parse(file.file_content)
          if (
            scarbCompile.file_content_map_array?.find(
              (file: { file_name: string }) =>
                file.file_name ===
                contractName + '.compiled_contract_class.json'
            ) == null
          ) {
            notifyCasmInclusion = true
            continue
          }
          const casm = JSON.parse(
            scarbCompile.file_content_map_array.find(
              (file: { file_name: string }) =>
                file.file_name ===
                contractName + '.compiled_contract_class.json'
            )?.file_content ?? ''
          )
          const genContract = await genContractData(
            contractName,
            file.file_name,
            JSON.stringify(sierra),
            JSON.stringify(casm)
          )
          if (genContract != null) contractsToStore.push(genContract)
        }
      }

      if (contractsToStore.length > 1) {
        setSelectedContract(contractsToStore[0])
        setContracts([...contracts, ...contractsToStore])
      } else {
        if (selectedContract == null) setSelectedContract(contracts[0])
      }
      if (notifyCasmInclusion) {
        await showNotification(
          "Please include 'casm=true' in Scarb.toml to deploy cairo contracts"
        )
      }

      setStatus('Saving compilation output files...')
      try {
        for (const file of scarbCompile.file_content_map_array) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          const filePath = `${scarbPath}/target/dev/${file.file_name}`
          await writeFileContent(
            filePath,
            JSON.stringify(JSON.parse(file.file_content))
          )
        }
        await showNotification(
          `Compilation resultant files are written to ${scarbPath}/target/dev directory`
        )
      } catch (e) {
        if (e instanceof Error) {
          await showNotification(
            e.message + ' try deleting the dir: ' + scarbPath + 'target/dev'
          )
        }
        remixClient.emit('statusChanged', {
          key: 'succeed',
          type: 'warning',
          title: 'Failed to save artifacts'
        })
      }
      setStatus('done')
      setAccordian('deploy')
    } catch (e) {
      setStatus('failed')
      console.log('error: ', e)
    }
    setIsCompiling(false)
  }

  async function genContractData (
    contractName: string,
    path: string,
    sierraFile: string,
    casmFile: string
  ): Promise<Contract | null> {
    const sierra = await JSON.parse(sierraFile)
    const casm = await JSON.parse(casmFile)
    const compiledClassHash = hash.computeCompiledClassHash(casm)
    const classHash = hash.computeContractClassHash(sierraFile)
    const sierraClassHash = hash.computeSierraContractClassHash(sierra)
    if (
      contracts.find(
        (contract) =>
          contract.classHash === classHash &&
          contract.compiledClassHash === compiledClassHash
      ) != null
    ) {
      return null
    }
    const contract = {
      name: contractName,
      abi: sierra.abi,
      compiledClassHash,
      classHash,
      sierraClassHash,
      sierra: sierraFile,
      casm,
      path,
      deployedInfo: [],
      declaredInfo: [],
      address: ''
    }
    return contract
  }

  return (
    <div>
      {compilations.map((compilation, idx) => {
        return (
          <CompilationCard
            key={`${JSON.stringify(compilation)}${idx}`}
            validation={compilation.validation}
            isLoading={compilation.isLoading}
            onClick={compilation.onClick}
            compileScarb={compileScarb}
            currentWorkspacePath={currWorkspacePath}
          />
        )
      })}
    </div>
  )
}

export default Compilation
