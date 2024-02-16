import { PluginClient } from '@remixproject/plugin'
import { createClient } from '@remixproject/plugin-webview'
import { fetchGitHubFilesRecursively } from '../utils/initial_scarb_codes'
import axios from 'axios'

export class RemixClient extends PluginClient {
  constructor () {
    super()
    this.methods = ['loadFolderFromUrl', 'loadFolderFromGithub']
  }

  async loadFolderFromUrl (url: string): Promise<void> {
    try {
      await this.call('filePanel', 'createWorkspace', 'code-sample', false)
      // Fetch JSON data from the URL
      const response = await axios.get(url)
      const folderContent = response.data

      // Iterate over each file in the folderContent
      for (const [filePath, fileContent] of Object.entries(folderContent)) {
        await this.call('fileManager', 'setFile', filePath, fileContent as string)
      }

      console.log('Folder loaded successfully.')
    } catch (error) {
      console.error('Error loading folder:', error)
    }
  }

  async loadFolderFromGithub (url: string, folderPath: string): Promise<void> {
    console.log('loadFolderFromGithub', url, folderPath)
    try {
      await this.call('filePanel', 'createWorkspace', 'code-sample', false)
      const folder = await fetchGitHubFilesRecursively(url, folderPath)
      console.log('folder', folder)
      for (const file of folder) {
        if (file !== null) {
          let fileContent = file.content
          if (file.fileName === 'Scarb.toml') {
            fileContent = fileContent.concat('\ncasm = true\n')
          }
          await this.call('fileManager', 'setFile', `${file.path}/${file.fileName}`, fileContent)
        }
      }
      // write Scarb.toml at root level
      try {
        const endpoint = `https://raw.githubusercontent.com/${url}/main/Scarb.toml`
        const response = await axios.get(endpoint)
        const fileContent = response.data.concat('\ncasm = true\n')
        await this.call('fileManager', 'setFile', 'Scarb.toml', fileContent)
      } catch (error) {
        console.error('Error writing Scarb.toml:', error)
      }
    } catch (error) {
      console.error('Error loading folder from GitHub:', error)
    }
  }
}
const remixClient = createClient(new RemixClient())

remixClient.onload().then(async () => {
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

    console.log('exampleRepo', exampleRepo)

    try {
      for (const file of exampleRepo) {
        const filePath = file?.path
          .replace('examples/starknet_multiple_contracts/', '')
          .replace('examples/starknet_multiple_contracts', '') ?? ''

        let fileContent: string = file?.content ?? ''

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
}).catch((error) => {
  console.error('Error loading remix client:', error)
})

const useRemixClient = (): {
  remixClient: typeof remixClient
} => {
  return { remixClient }
}

export default useRemixClient
