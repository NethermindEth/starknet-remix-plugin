import React, { useEffect, useState } from 'react'
import { PluginClient } from '@remixproject/plugin'
import { createClient } from '@remixproject/plugin-webview'

import './App.css'
import Plugin from './features/Plugin'
import { RemixClientContext } from './contexts/RemixClientContext'
import Loader from './ui_components/CircularLoader'

const remixClient = createClient(new PluginClient())
const App: React.FC = () => {
  const [pluginLoaded, setPluginLoaded] = useState<boolean>(false)

  useEffect(() => {
    const id = setTimeout(async (): Promise<void> => {
      await remixClient.onload(() => {
        setPluginLoaded(true)
      })
    }, 10)
    return () => {
      clearInterval(id)
    }
  })

  return (
    <RemixClientContext.Provider value={remixClient}>
      <div className="shell">{pluginLoaded ? <Plugin /> : <Loader />}</div>
    </RemixClientContext.Provider>
  )
}

export default App
