import { useContext, useEffect, useState } from "react";

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

import { apiUrl } from "../../utils/network";
import { RemixClientContext } from "../../contexts/RemixClientContext";

interface PluginProps {}

function Plugin(props: PluginProps) {

  const remixClient = useContext(RemixClientContext);



  // START : Get Cairo version
  const [cairoVersion, setCairoVersion] = useState("");

  useEffect(() => {
    setTimeout(async () => {
      const response = await fetch(`${apiUrl}/cairo_version`, {
        method: "GET",
        redirect: "follow",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });
      setCairoVersion(await response.text());
    }, 100);
  });
  // END : Get Cairo version

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
  const [isLocalDevnetAlive, setIsLocalDevnetAlive] = useState<boolean>(true);

  const [availableAccounts, setAvailableAccounts] = useState<DevnetAccount[]>(
    []
  );
  const [selectedAccount, setSelectedAccount] = useState<DevnetAccount | null>(
    null
  );


  const [provider, setProvider] = useState<Provider | null>(null);
  const [account, setAccount] = useState<Account | null>(null);

  // devnet live status check
  useEffect(() => {
    const interval = setInterval(async () => {

      try {
        const response = await fetch(`${devnet.url}/is_alive`, {
          method: "GET",
          redirect: "follow",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const status = await response.text();

        if (status !== "Alive!!!" || response.status !== 200) {
          setIsLocalDevnetAlive(false);
          remixClient.call('notification' as any, 'toast', 'Devnet Server is not healthy at the moment');
        }else{
          setIsLocalDevnetAlive(true);
        }
      } catch (error) {
        setIsLocalDevnetAlive(false);
        remixClient.call('notification' as any, 'toast', `Could not reach to devnet server: ${devnet.url}`);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [devnet, remixClient]);

  useEffect(() => {
    setTimeout(async () => {
      const accounts = await getAccounts(devnet.url);
      setAvailableAccounts(accounts);
    }, 100);
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

  return (
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
                Using {cairoVersion}
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
  );
}

export default Plugin;
