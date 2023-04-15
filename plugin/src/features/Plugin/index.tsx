import { useEffect, useState } from "react";

import { Card } from "../../components/Card";
import Nav from "../../components/Nav";
import { ConnectionContext } from "../../contexts/ConnectionContext";
import { CompiledContractsContext } from "../../contexts/CompiledContractsContext";
import { Connection as ConnectionType } from "../../types/accounts";
import { Contract } from "../../types/contracts";
import Connection from "../Connection";
import "./styles.css";

interface PluginProps {}

function Plugin(props: PluginProps) {
  const [cairoVersion, setCairoVersion] = useState("");
  // Store connected wallet and provider

  const [connection, setConnection] = useState<ConnectionType>({
    connected: false,
    account: undefined,
    provider: undefined,
    network: "goerli-alpha",
  });

  // Store a list of compiled contracts
  const [compiledContracts, setCompiledContracts] = useState<Contract[]>([]);
  // Store the current contract for UX purposes
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );

  useEffect(() => {
    // TODO: Call the API and make the api return the version of the Cairo compiler on use effect
    setCairoVersion("1.0.0-alpha.6");
  }, []);

  return (
    <>
      <ConnectionContext.Provider value={{ connection, setConnection }}>
        <CompiledContractsContext.Provider
          value={{
            contracts: compiledContracts,
            setContracts: setCompiledContracts,
            selectedContract: selectedContract,
            setSelectedContract: setSelectedContract,
          }}
        >
          <div className="mb-1">
            <label className="cairo-version-legend">
              Using cairo version {cairoVersion}
            </label>
          </div>
          <Nav />
          <div
            style={{
              position: "fixed",
              bottom: "0",
              left: "0",
              right: "0",
              opacity: "1",
            }}
          >
            <Connection />
          </div>
        </CompiledContractsContext.Provider>
      </ConnectionContext.Provider>
    </>
  );
}

export default Plugin;
