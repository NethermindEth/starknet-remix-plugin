import { useContext, useEffect, useState } from "react";
import { CompiledContractsContext } from "../../contexts/CompiledContractsContext";
import { ConnectionContext } from "../../contexts/ConnectionContext";
import { Contract } from "../../types/contracts";
import { Environment } from "../Environment";
import "./styles.css";

import { apiUrl } from "../../utils/network";
import {
  Account,
  AccountInterface,
  Provider,
  ProviderInterface,
} from "starknet";
import Compilation from "../Compilation";
import Deployment from "../Deployment";
import Interaction from "../Interaction";
import { RemixClientContext } from "../../contexts/RemixClientContext";

interface PluginProps {}

function Plugin(_: PluginProps) {
  // START : Get Cairo version
  const [cairoVersion, setCairoVersion] = useState("");
  const remixClient = useContext(RemixClientContext);

  useEffect(() => {
    setTimeout(async () => {
      try {
        const response = await fetch(`${apiUrl}/cairo_version`, {
          method: "GET",
          redirect: "follow",
          headers: {
            "Content-Type": "application/octet-stream",
          },
        });
        setCairoVersion(await response.text());
      } catch (e) {
        remixClient.cancel('notification' as any, 'toast');
        await remixClient.call(
          "notification" as any,
          "toast",
          "🔴 Failed to fetch cairo version from the compilation server!", 
        );
        console.error(e);
      }
    }, 100);
  }, [remixClient]);
  // END : Get Cairo version


  // START: CAIRO CONTRACTS
  // Store a list of compiled contracts
  const [compiledContracts, setCompiledContracts] = useState<Contract[]>([]);
  // Store the current contract for UX purposes
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  // END: CAIRO CONTRACTS

  // START: ACCOUNT, NETWORK, PROVIDER
  // Store connected wallet, account and provider
  const [provider, setProvider] = useState<Provider | ProviderInterface | null>(
    null
  );
  const [account, setAccount] = useState<Account | AccountInterface | null>(
    null
  );
  // END: ACCOUNT, NETWORK, PROVIDER

  return (
    // add a button for selecting the cairo version
    <>
      <div className="mb-1">
        <label className="cairo-version-legend">Using {cairoVersion}</label>
      </div>
      <ConnectionContext.Provider
        value={{
          provider,
          setProvider,
          account,
          setAccount,
        }}
      >
        <CompiledContractsContext.Provider
          value={{
            contracts: compiledContracts,
            setContracts: setCompiledContracts,
            selectedContract: selectedContract,
            setSelectedContract: setSelectedContract,
          }}
        >
          <Compilation />
          <Deployment />
          <Interaction />
        </CompiledContractsContext.Provider>
        <Environment />
      </ConnectionContext.Provider>
    </>
  );
}

export default Plugin;
