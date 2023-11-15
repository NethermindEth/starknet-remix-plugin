import React from 'react'

import './App.css'
import Plugin from './features/Plugin'
import Loader from './components/ui_components/CircularLoader'
import FullScreenOverlay from './components/ui_components/FullScreenOverlay'
import { pluginLoaded } from './atoms/remixClient'
import { useAtomValue } from 'jotai'

const App: React.FC = () => {
  return (
    <div className="shell bg-primary">
      {useAtomValue(pluginLoaded)
        ? (
          <Plugin />
          )
        : (
          <FullScreenOverlay>
            <Loader />
          </FullScreenOverlay>
          )}
    </div>
  )
}

export default App
