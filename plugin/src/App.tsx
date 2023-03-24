import { createClient } from "@remixproject/plugin-webview";
import { PluginClient } from "@remixproject/plugin";
import { InjectedConnector, StarknetConfig } from "@starknet-react/core";

import { useEffect, useState } from "react";

import "./App.css";

import Nav from "./components/Nav";

const remixClient = createClient(new PluginClient());
function App() {
  const [cairoVersion, setCairoVersion] = useState("1.0.0-alpha.6");
  const connectors = [
    new InjectedConnector({ options: { id: "argentX" } }),
    new InjectedConnector({ options: { id: "braavos" } }),
  ];
  useEffect(() => {
    // Call the API and make the api return the version of the Cairo compiler on use effect
    setCairoVersion("1.0.0-alpha.6");
  }, []);

  return (
    <StarknetConfig connectors={connectors}>
      <div className="shell">
        <div className="mb-1">
          <label className="cairo-version-legend">
            Using cairo version {cairoVersion}
          </label>
        </div>
        <Nav remixClient={remixClient}></Nav>
      </div>
    </StarknetConfig>
  );
}

export default App;
