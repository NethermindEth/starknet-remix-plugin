import { PluginClient } from '@remixproject/plugin'
import { createClient } from '@remixproject/plugin-webview'

const remixClient = createClient(new PluginClient())

const useRemixClient = (): {
  remixClient: typeof remixClient
} => {
  return { remixClient }
}

export default useRemixClient
