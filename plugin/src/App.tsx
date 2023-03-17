import { createClient } from "@remixproject/plugin-webview";
import { PluginClient } from "@remixproject/plugin";
import { Provider } from "starknet";
import { useEffect, useState } from "react";

import "./App.css";

import Nav from "./components/Nav";

const remixClient = createClient(new PluginClient());

function App() {
  // Use state variable cairoVersion
  const [cairoVersion, setCairoVersion] = useState("1.0.0-alpha.4");
  // Call the API and make the api return the version of the Cairo compiler on use effect
  useEffect(() => {
    setCairoVersion("1.0.0-alpha.4");
  }, []);

  const provider = new Provider({
    sequencer: { baseUrl: "http://127.0.0.1:5050" },
  });

  return (
    <div className="shell">
      <div className="mb-1">
        <label className="cairo-version-legend">
          Using cairo version {cairoVersion}
        </label>
      </div>
      <Nav remixClient={remixClient}></Nav>
    </div>
  );
}

export default App;
