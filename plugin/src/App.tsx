import { createClient } from "@remixproject/plugin-webview";
import { PluginClient } from "@remixproject/plugin";
import { useState } from "react";

import "./App.css";

import Nav from "./components/Nav";

const remixClient = createClient(new PluginClient());

function App() {
  // Use state variable cairoVersion
  const [cairoVersion, setCairoVersion] = useState("1.0.0-alpha.3");
  // Set cairoVersion to the version of the Cairo compiler on use effect when loading the webapp
  // Eventually we could load cairo versions from a dropdown menu
  // useEffect(() => {
  //   remixClient.call("cairo", "getVersion").then((version: string) => {
  //     setCairoVersion(version);
  //   });
  // }, []);

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
