import { PluginClient } from '@remixproject/plugin'
import { createClient } from '@remixproject/plugin-webview'
import { useEffect, useState } from 'react'
import { fetchGitHubFilesRecursively } from '../utils/initial_scarb_codes'
import { pluginLoaded as atomPluginLoaded } from '../atoms/remixClient'
import { type SetStateAction, useAtom, useSetAtom } from 'jotai'
import { getFileNameFromPath, getFileExtension } from '../utils/utils'
import { currentFilenameAtom, isValidCairoAtom, noFileSelectedAtom, tomlPathsAtom } from '../atoms/compilation'

const remixClient = createClient(new PluginClient())

const createExampleWorkspace = async (client: typeof remixClient): Promise<void> => {
  await client.filePanel.createWorkspace(
    'cairo_scarb_sample',
    true
  )
  try {
    await client.fileManager.mkdir('hello_world')
  } catch (e) {
    console.log(e)
  }
  const exampleRepo = await fetchGitHubFilesRecursively(
    'software-mansion/scarb',
    'examples/starknet_multiple_contracts'
  )

  try {
    for (const file of exampleRepo) {
      const filePath = file?.path
        .replace('examples/starknet_multiple_contracts/', '')
        .replace('examples/starknet_multiple_contracts', '') ?? ''

      let fileContent: string = file?.content ?? ''

      if (file != null && file.fileName === 'Scarb.toml') {
        fileContent = fileContent.concat('\ncasm = true')
        await client.fileManager.writeFile(
          `hello_world/${filePath}/${file.fileName}`,
          fileContent
        )
      } else if (file != null) {
        await client.fileManager.writeFile(
          `hello_world/${filePath}/${file.fileName}`,
          fileContent
        )
      }
    }
  } catch (e) {
    if (e instanceof Error) {
      await client.call('notification' as any, 'alert', {
        id: 'starknetRemixPluginAlert',
        title: 'Please check the write file permission',
        message: e.message + '\n' + 'Did you provide the write file permission?'
      })
    }
    console.log(e)
  }
}

const checkWorkspaceAndPopulateExample = async (client: typeof remixClient): Promise<void> => {
  const workspaces = await client.filePanel.getWorkspaces()

  const workspaceLets: Array<{ name: string, isGitRepo: boolean }> =
    JSON.parse(JSON.stringify(workspaces))

  if (
    !workspaceLets.some(
      (workspaceLet) => workspaceLet.name === 'cairo_scarb_sample'
    )
  ) {
    createExampleWorkspace(client).catch(e => { console.error(e) })
  }
}

const getTomlPaths = async (
  workspacePath: string,
  currPath: string,
  client: typeof remixClient
): Promise<string[]> => {
  const resTomlPaths: string[] = []

  try {
    const allFiles = await client.fileManager.readdir(
      workspacePath + '/' + currPath
    )
    // get keys of allFiles object
    const allFilesKeys: string[] = Object.keys(allFiles)
    // const get all values of allFiles object
    const allFilesValues = Object.values(allFiles)

    for (let i = 0; i < allFilesKeys.length; i++) {
      if (allFilesKeys[i].endsWith('Scarb.toml')) {
        resTomlPaths.push(currPath)
      }

      if (Object.values(allFilesValues[i])[0] as unknown as boolean) {
        const recTomlPaths = await getTomlPaths(
          workspacePath,
          allFilesKeys[i],
          client
        )
        resTomlPaths.push(...recTomlPaths)
      }
    }
  } catch (e) {
    console.log('error: ', e)
  }
  return resTomlPaths
}

const getAndSetTomlPaths = async (
  client: typeof remixClient,
  currentWorkspacePath: string,
  setTomlPaths: (arg: SetStateAction<string[]>) => void): Promise<void> => {
  try {
    const allTomlPaths = await getTomlPaths(currentWorkspacePath, '', client)
    setTomlPaths(allTomlPaths)
  } catch (e) {
    console.log('error: ', e)
  }
}

const useRemixClient = (): {
  remixClient: typeof remixClient
  isPluginLoaded: boolean
  currentFilePath: string
  currWorkspacePath: string
  getCurrentFileContent: () => Promise<string>
  writeFileContent: (path: string, content: any) => Promise<void>
  showNotification: (
  message: string | Record<string, string>,
  type?: string
  ) => Promise<void>
} => {
  const [pluginLoaded, setPluginLoaded] = useAtom(atomPluginLoaded)

  // Atoms
  const [noFileSelected, setNoFileSelected] = useAtom(noFileSelectedAtom)
  const [currentFileName, setCurrentFileName] = useAtom(currentFilenameAtom)
  const setIsValidCairo = useSetAtom(isValidCairoAtom)
  const setTomlPaths = useSetAtom(tomlPathsAtom)
  const [currWorkspacePath, setCurrWorkspacePath] = useState<string>('')
  const [currentFilePath, setCurrentFilePath] = useState<string>('')

  useEffect(() => {
    remixClient.onload(() => {
      setPluginLoaded(true)
      checkWorkspaceAndPopulateExample(remixClient).catch(e => { console.error(e) })
      remixClient.filePanel.getCurrentWorkspace().then(currWorkspace => {
        setCurrWorkspacePath(currWorkspace.absolutePath)
      }).catch(e => {
        console.error(e)
      })
    }).catch(e => {
      console.error(e)
    })
  }, [])

  useEffect(() => {
    // This runs every second once
    const timeoutId = setTimeout(() => {
      remixClient.filePanel.getCurrentWorkspace().then((currWorkspace) => {
        setCurrWorkspacePath(currWorkspace.absolutePath)
      }).catch(e => {
        console.error(e)
      })
    }, 1000)
    return () => { clearInterval(timeoutId) }
  }, [])

  useEffect(() => {
    // Remix Client Event Listeners
    remixClient.on('fileManager', 'noFileSelected', () => {
      setNoFileSelected(true)
    })

    remixClient.on(
      'fileManager',
      'currentFileChanged',
      (currentFileChanged: any) => {
        const filename = getFileNameFromPath(currentFileChanged)
        const currentFileExtension = getFileExtension(filename)
        setIsValidCairo(currentFileExtension === 'cairo')
        setCurrentFileName(filename)
        remixClient.emit('statusChanged', {
          key: 'succeed',
          type: 'info',
          title: 'Current file: ' + filename
        })
        setNoFileSelected(false)
      }
    )

    remixClient.on('fileManager', 'fileAdded', (_: any) => {
      getAndSetTomlPaths(remixClient, currWorkspacePath, setTomlPaths).catch(e => { console.error(e) })
    })
    remixClient.on('fileManager', 'currentFileChanged', (_: any) => {
      getAndSetTomlPaths(remixClient, currWorkspacePath, setTomlPaths).catch(e => { console.error(e) })
    })
    remixClient.on('fileManager', 'folderAdded', (_: any) => {
      getAndSetTomlPaths(remixClient, currWorkspacePath, setTomlPaths).catch(e => { console.error(e) })
    })
    remixClient.on('fileManager', 'fileRemoved', (_: any) => {
      getAndSetTomlPaths(remixClient, currWorkspacePath, setTomlPaths).catch(e => { console.error(e) })
    })
    remixClient.on('filePanel', 'workspaceCreated', (_: any) => {
      getAndSetTomlPaths(remixClient, currWorkspacePath, setTomlPaths).catch(e => { console.error(e) })
    })
    remixClient.on('filePanel', 'workspaceRenamed', (_: any) => {
      getAndSetTomlPaths(remixClient, currWorkspacePath, setTomlPaths).catch(e => { console.error(e) })
    })
  }, [])

  const getCurrentFileInfo = async (): Promise<void> => {
    try {
      if (noFileSelected) {
        throw new Error('No file selected')
      }

      // get current file
      const currentFilePath = await remixClient.call(
        'fileManager',
        'getCurrentFile'
      )
      if (currentFilePath.length > 0) {
        const filename = getFileNameFromPath(currentFilePath)
        const currentFileExtension = getFileExtension(filename)
        setIsValidCairo(currentFileExtension === 'cairo')
        setCurrentFileName(filename)
        setCurrentFilePath(currentFilePath)

        remixClient.emit('statusChanged', {
          key: 'succeed',
          type: 'info',
          title: 'Current file: ' + filename
        })
      }
    } catch (e) {
      remixClient.emit('statusChanged', {
        key: 'failed',
        type: 'info',
        title: 'Please open a cairo file to compile'
      })
      console.log('error: ', e)
    }
  }

  useEffect(() => {
    getCurrentFileInfo().catch(e => { console.error(e) })
  }, [currentFileName, noFileSelected])

  const getCurrentFileContent = async (): Promise<string> => {
    return await remixClient.call(
      'fileManager',
      'readFile',
      currentFilePath
    )
  }

  const writeFileContent = async (
    path: string,
    content: string
  ): Promise<void> => {
    await remixClient.call(
      'fileManager',
      'writeFile',
      path,
      content
    )
  }

  const showNotification = async (
    message: string | Record<string, string>,
    type?: string
  ): Promise<void> => {
    return await remixClient.call(
      'notification' as any,
      type ?? 'toast',
      message
    )
  }

  return {
    remixClient,
    isPluginLoaded: pluginLoaded,
    currentFilePath,
    currWorkspacePath,
    getCurrentFileContent,
    writeFileContent,
    showNotification
  }
}

export default useRemixClient
