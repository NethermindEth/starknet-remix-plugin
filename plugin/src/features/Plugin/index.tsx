import { useEffect, useState } from "react";

import { Account, Provider } from "starknet";
import Nav from "../../components/Nav";
import { CompiledContractsContext } from "../../contexts/CompiledContractsContext";
import { ConnectionContext } from "../../contexts/ConnectionContext";
import { DevnetContext } from "../../contexts/DevnetContext";
import {
  Connection as ConnectionType,
  DevnetAccount,
} from "../../types/accounts";
import { Contract } from "../../types/contracts";
import {
  Devnet as DevnetType,
  devnets,
  getAccounts,
} from "../../utils/network";
import { Devnet } from "../Devnet";
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

  // using local devnet initially
  const [devnet, setDevnet] = useState<DevnetType>(devnets[0]);

  const [availableAccounts, setAvailableAccounts] = useState<DevnetAccount[]>(
    []
  );
  const [selectedAccount, setSelectedAccount] = useState<DevnetAccount | null>(
    null
  );
  const [provider, setProvider] = useState<Provider | null>(null);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const setAccounts = async () => {
      const accounts = await getAccounts(devnet.url);
      setAvailableAccounts(accounts);
    };
    setAccounts();
  }, [devnet]);

  useEffect(() => {
    if (availableAccounts.length > 0) {
      setSelectedAccount(availableAccounts[0]);
      const localProvider = new Provider({
        sequencer: { baseUrl: devnet.url },
      });
      setProvider(localProvider);
      const localAccount = new Account(
        localProvider,
        availableAccounts[0].address,
        availableAccounts[0].private_key
      );
      setAccount(localAccount);
    }
  }, [availableAccounts, devnet]);

  useEffect(() => {
    // TODO: Call the API and make the api return the version of the Cairo compiler on use effect
    setCairoVersion("v1.0.0-rc0");
  }, []);

  return (
    <>
      <DevnetContext.Provider
        value={{
          devnet,
          setDevnet,
          availableAccounts,
          setAvailableAccounts,
          selectedAccount,
          setSelectedAccount,
          provider,
          setProvider,
          account,
          setAccount,
        }}
      >
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
              <Devnet />
            </div>
          </CompiledContractsContext.Provider>
        </ConnectionContext.Provider>
      </DevnetContext.Provider>
    </>
  );
}

export default Plugin;
