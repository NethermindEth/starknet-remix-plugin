import { useEffect, useState } from "react";

import { Contract } from "../../types/contracts";
import Nav from "../../components/Nav";
import "./styles.css";
import Connection from "../Connection";
import { Card } from "../../components/Card";

interface PluginProps {}

function Plugin(props: PluginProps) {
  const [cairoVersion, setCairoVersion] = useState("1.0.0-alpha.4");

  useEffect(() => {
    // TODO: Call the API and make the api return the version of the Cairo compiler on use effect
    setCairoVersion("1.0.0-alpha.4");
  }, []);

  // Store a list of compiled contracts
  const [compiledContracts, setCompiledContracts] = useState<Contract[]>([]);
  const [currentContract, setCurrentContract] = useState<Contract | null>(null);

  // Show the connect wallet button if the user is not connected and if there is at least one compiled contract

  return (
    <div>
      <div className="mb-1">
        <label className="cairo-version-legend">
          Using cairo version {cairoVersion}
        </label>
      </div>
      <Card header={""}>
        <Connection
          onConnectionChange={function (
            connected: boolean,
            account: any,
            provider: any
          ): void {
            throw new Error("Function not implemented.");
          }}
        ></Connection>
      </Card>
      <Nav />
    </div>
  );
}

export default Plugin;
