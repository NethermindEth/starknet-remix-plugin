import { PluginClient } from "@remixproject/plugin";
import { createClient } from "@remixproject/plugin-webview";
import { StarknetConfig } from "@starknet-react/core";

import "./App.css";
import Plugin from "./features/Plugin";
import { connectors } from "./utils/constants";
import { RemixClientContext } from "./contexts/RemixClientContext";

const remixClient = createClient(new PluginClient());
function App() {
  return (
    <StarknetConfig connectors={connectors}>
      <RemixClientContext.Provider value={remixClient}>
        <div className="shell">
          <Plugin />
        </div>
      </RemixClientContext.Provider>
    </StarknetConfig>
  );
}

export default App;
