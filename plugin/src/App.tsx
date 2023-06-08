import { PluginClient } from "@remixproject/plugin";
import { createClient } from "@remixproject/plugin-webview";

import "./App.css";
import Plugin from "./features/Plugin";
import { RemixClientContext } from "./contexts/RemixClientContext";
import { useEffect, useState } from "react";

const remixClient = createClient(new PluginClient());
function App() {
  const [pluginLoaded, setPluginLoaded] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(async () => {
      await remixClient.onload(() => {
        setPluginLoaded(true);
      });
    }, 10);
  });

  return (
    <RemixClientContext.Provider value={remixClient}>
      <div className="shell">
        {pluginLoaded ? <Plugin /> : <p> Plugin is loading...</p>}
      </div>
    </RemixClientContext.Provider>
  );
}

export default App;
