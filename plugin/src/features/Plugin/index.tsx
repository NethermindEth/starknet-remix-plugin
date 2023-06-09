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
import { StarknetWindowObject, connect, disconnect } from "get-starknet";
import Nethermind from "../../components/NM";
import * as D from "../../ui_components/Dropdown";
import { BsChevronDown } from "react-icons/bs";

interface PluginProps {}

function Plugin(_: PluginProps) {
  // START : Get Cairo version
  const [cairoVersion, setCairoVersion] = useState("no version");
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

  // Dummy Cairo Verison
  const [versions, setVersion]  = useState<string[]>([
    "cairo-lang-compiler 1.0.0-alpha.6",
    "cairo-lang-compiler 1.0.0-alpha.7",
    "cairo-lang-compiler 1.0.1",
  ]);

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
          <div className="version-wrapper">
            <div>
              <D.Root>
                <D.Trigger>
                  <label className="cairo-version-legend">
                    Using {cairoVersion} <BsChevronDown />
                  </label>
                </D.Trigger>
                <D.Portal>
                  <D.Content>
                    {versions.map((v, i) => {
                      return <D.Item key={i} onClick={() => setCairoVersion(v)}>{v}</D.Item>;
                    })}
                  </D.Content>
                </D.Portal>
              </D.Root>
            </div>

            <label className="cairo-version-legend">
              Powered by <Nethermind size="xs" />
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
            <button
              onClick={async () => {
                const starknet = await connect({ modalMode: "alwaysAsk" });
                console.log("starknet", starknet);
                await disconnect({ clearLastWallet: true });
              }}
            >
              Connect
            </button>
            <Devnet />
          </div>
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
