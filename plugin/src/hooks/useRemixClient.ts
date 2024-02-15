import { PluginClient } from '@remixproject/plugin'
import { createClient } from '@remixproject/plugin-webview'

export class RemixClient extends PluginClient {
  constructor () {
    super()
    this.methods = ['loadFolderFromUrl']
  }

  loadFolderFromUrl (url: string, filePath: string | undefined): void {
    console.log('loadFolderFromUrl', url, filePath)
  }
}
const remixClient = createClient(new RemixClient())

const useRemixClient = (): {
  remixClient: typeof remixClient
} => {
  return { remixClient }
}

export default useRemixClient
