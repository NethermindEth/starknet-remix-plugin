import { PluginClient } from '@remixproject/plugin'
import { createClient } from '@remixproject/plugin-webview'
import { fetchGitHubFilesRecursively } from '../utils/initial_scarb_codes'
import axios from 'axios'

export class RemixClient extends PluginClient {
  constructor () {
    super()
    this.methods = ['loadFolderFromUrl']
  }

  async loadFolderFromUrl (url: string, filePath: string | undefined): Promise<void> {
    try {
      await this.call('filePanel', 'createWorkspace', 'code-sample', false)
      // Fetch JSON data from the URL
      const response = await axios.get(url)
      const folderContent = response.data

      // Check if filePath is provided, if not, set it to an empty string
      filePath = filePath ?? ''

      // Iterate over each file in the folderContent
      for (const [fileName, fileContent] of Object.entries(folderContent)) {
        // Construct the full file path
        const fullFilePath = `${filePath}/${fileName}`
        await this.call('fileManager', 'setFile', fullFilePath, fileContent as string)
      }

      console.log('Folder loaded successfully.')
    } catch (error) {
      console.error('Error loading folder:', error)
    }
  }

  async loadFolderFromGithub (url: string, folderPath: string, filePath: string | undefined): Promise<void> {
    console.log('loadFolderFromGithub', url, folderPath, filePath)
    try {
      await this.call('filePanel', 'createWorkspace', 'code-sample', false)
      const folder = await fetchGitHubFilesRecursively(url, folderPath)
      console.log('folder', folder)
      for (const file of folder) {
        if (file !== null) {
          await this.call('fileManager', 'setFile', file.path, file.content)
        }
      }
      if (filePath !== undefined) {
        await this.call('fileManager', 'switchFile', filePath)
      }
    } catch (error) {
      console.error('Error loading folder from GitHub:', error)
    }
  }
}
const remixClient = createClient(new RemixClient())

const useRemixClient = (): {
  remixClient: typeof remixClient
} => {
  return { remixClient }
}

export default useRemixClient
