import { PluginClient } from '@remixproject/plugin'
import { createClient } from '@remixproject/plugin-webview'
import { createContext } from 'react'

const remixClient = createClient(new PluginClient())

const RemixClientContext = createContext(remixClient)

export { RemixClientContext }
