import { useContext, useState } from "react";
import { Card } from "../../components/Card";
import DevnetAccountSelector from "../../components/DevnetAccountSelector";
import "./styles.css";
import {
  ConnectOptions,
  DisconnectOptions,
  StarknetWindowObject,
  connect,
  disconnect,
} from "get-starknet";
import { RemixClientContext } from "../../contexts/RemixClientContext";
import { Devnet, devnets } from "../../utils/network";
import EnvironmentSelector from "../../components/EnvironmentSelector";
import { ConnectionContext } from "../../contexts/ConnectionContext";
import Wallet from "../../components/Wallet";

interface ConnectionProps {}

function Environment(_: ConnectionProps) {
  const remixClient = useContext(RemixClientContext);
  const { setAccount, setProvider } = useContext(ConnectionContext);

  // START: DEVNET
  const [devnet, setDevnet] = useState<Devnet>(devnets[0]);
  const [devnetEnv, setDevnetEnv] = useState<boolean>(true);
  // END: DEVNET

  // START: WALLET
  const [starknetWindowObject, setStarknetWindowObject] =
    useState<StarknetWindowObject | null>(null);

  const connectWalletHandler = async (
    options: ConnectOptions = {
      modalMode: "alwaysAsk",
      modalTheme: "dark",
    },
  ) => {
    try {
      const connectedStarknetWindowObject = await connect(options);
      if (!connectedStarknetWindowObject) {
        throw new Error("Failed to connect to wallet");
      }
      await connectedStarknetWindowObject.enable({ starknetVersion: "v4" });
      connectedStarknetWindowObject.on(
        "accountsChanged",
        (accounts: string[]) => {
          console.log("accountsChanged", accounts);
          connectWalletHandler({
            modalMode: "neverAsk",
            modalTheme: "dark",
          });
          connectedStarknetWindowObject.off(
            "accountsChanged",
            (_accounts: string[]) => {}
          );
        }
      );

      connectedStarknetWindowObject.on("networkChanged", (network?: string) => {
        console.log("networkChanged", network);
        connectWalletHandler({
          modalMode: "neverAsk",
          modalTheme: "dark",
        });
        connectedStarknetWindowObject.off(
          "networkChanged",
          (_network?: string) => {}
        );
      });
      setStarknetWindowObject(connectedStarknetWindowObject);
      if (connectedStarknetWindowObject.account)
        setAccount(connectedStarknetWindowObject.account);
      if (connectedStarknetWindowObject.provider)
        setProvider(connectedStarknetWindowObject.provider);
    } catch (e) {
      if (e instanceof Error) {
        await remixClient.call("notification" as any, "error", e.message);
      }
      console.log(e);
    }
  };

  const disconnectWalletHandler = async (
    options: DisconnectOptions = {
      clearLastWallet: true,
    }
  ) => {
    if (starknetWindowObject) {
      starknetWindowObject.off("accountsChanged", (_accounts: string[]) => {});
      starknetWindowObject.off("networkChanged", (_network?: string) => {});
    }
    await disconnect(options);
    setStarknetWindowObject(null);
    setAccount(null);
    setProvider(null);
  };

  // END: WALLET

  return (
    <div className="starknet-connection-component mb-8">
      <Card header="Environment">
        <div className="flex">
          <label className="">Environment selection</label>
          <EnvironmentSelector
            devnetEnv={devnetEnv}
            setDevnetEnv={setDevnetEnv}
            devnet={devnet}
            setDevnet={setDevnet}
            connectWalletHandler={connectWalletHandler}
            disconnectWalletHandler={disconnectWalletHandler}
          />
        </div>
        <div className="flex">
          {devnetEnv ? (
            <DevnetAccountSelector devnet={devnet} />
          ) : (
            <Wallet
              starknetWindowObject={starknetWindowObject}
              connectWalletHandler={connectWalletHandler}
              disconnectWalletHandler={disconnectWalletHandler}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

export { Environment };
