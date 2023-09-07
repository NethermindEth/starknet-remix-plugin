import React, { useEffect, useState } from 'react'
import { PluginClient } from '@remixproject/plugin'
import { createClient } from '@remixproject/plugin-webview'

import './App.css'
import Plugin from './features/Plugin'
import { RemixClientContext } from './contexts/RemixClientContext'
import Loader from './ui_components/CircularLoader'
import FullScreenOverlay from './ui_components/FullScreenOverlay'
import { fetchGitHubFilesRecursively } from './utils/initial_scarb_codes'

const remixClient = createClient(new PluginClient())
const App: React.FC = () => {
  const [pluginLoaded, setPluginLoaded] = useState<boolean>(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const id = setTimeout(async (): Promise<void> => {
      await remixClient.onload(() => {
        setPluginLoaded(true)
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setTimeout(async () => {
          const workspaces = await remixClient.filePanel.getWorkspaces()

          const workspaceLets: Array<{ name: string, isGitRepo: boolean }> =
            JSON.parse(JSON.stringify(workspaces))

          if (
            !workspaceLets.some(
              (workspaceLet) => workspaceLet.name === 'cairo_scarb_sample'
            )
          ) {
            await remixClient.filePanel.createWorkspace(
              'cairo_scarb_sample',
              true
            )
            try {
              await remixClient.fileManager.mkdir('hello_world')
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

                console.log('kljkljl', file?.fileName)

                if (file != null && file.fileName === 'Scarb.toml') {
                  fileContent = fileContent.concat('\ncasm = true')
                }

                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                await remixClient.fileManager.writeFile(
                  `hello_world/${
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    filePath
                  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                  }/${file?.fileName}`,
                  fileContent
                )
              }
            } catch (e) {
              if (e instanceof Error) {
                await remixClient.call('notification' as any, 'alert', {
                  id: 'starknetRemixPluginAlert',
                  title: 'Please check the write file permission',
                  message: e.message + '\n' + 'Did you provide the write file permission?'
                })
              }
              console.log(e)
            }
          }
        })
      })
    }, 1)
    return () => {
      clearInterval(id)
    }
  })

  return (
    <RemixClientContext.Provider value={remixClient}>
      <div className="shell">
        {pluginLoaded
          ? (
          <Plugin />
            )
          : (
          <FullScreenOverlay>
            <Loader />
          </FullScreenOverlay>
            )}
      </div>
    </RemixClientContext.Provider>
  )
}

export default App
