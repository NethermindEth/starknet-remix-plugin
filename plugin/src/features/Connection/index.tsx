import { connect, disconnect } from "get-starknet";
import { useContext, useMemo, useState } from "react";
import { constants } from "starknet";
import { ConnectionContext } from "../../contexts/ConnectionContext";
import { Account, StarknetChainId } from "../../types/accounts";
import { devnetUrl, networkEquivalents, networks } from "../../utils/constants";
import { getShortenedHash } from "../../utils/utils";
import "./styles.css";

interface ConnectionProps {}

function Connection(props: ConnectionProps) {
  const {
    connection: { account, connected, provider },
    setConnection,
  } = useContext(ConnectionContext);

  const [selectedNetwork, setSelectedNetwork] = useState("goerli-alpha");
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  const shortenedAddress = useMemo(() => {
    if (!account) return "";
    return getShortenedHash(account.address, 6, 4);
  }, [account]);

  // Currently complicated workflow due to Braavos not setting different chainId for devnet
  const handleNetworkChange = (event: any) => {
    setSelectedNetwork(event.target.value);
    setIsWrongNetwork(false);
    if (
      connected &&
      provider &&
      "baseUrl" in provider &&
      (provider.baseUrl as string).startsWith("http://localhost")
    ) {
      if (selectedNetwork !== devnetUrl) {
        setIsWrongNetwork(true);
      } else {
        setIsWrongNetwork(false);
        setConnection({
          connected: false,
          account: undefined,
          // TODO: Check/Disconnect.
          provider: provider,
        });
      }
    } else {
      if (
        connected &&
        provider &&
        "chainId" in provider &&
        selectedNetwork !==
          networkEquivalents.get(provider.chainId as StarknetChainId)
      ) {
        setIsWrongNetwork(true);
        setConnection({
          connected: false,
          account: undefined,
          provider: undefined,
        });
      }
    }
  };

  const networkSelect = (
    <select
      className="custom-select"
      aria-label=".form-select-sm example"
      onChange={handleNetworkChange}
    >
      {networks.map((network, index) => (
        <option
          value={network.value}
          defaultValue={selectedNetwork}
          key={index}
        >
          {network.name}
        </option>
      ))}
    </select>
  );

  const handleConnectWallet = async () => {
    console.log("Connecting wallet to " + selectedNetwork);
    try {
      const connectionData = await connect({
        modalMode: "alwaysAsk",
        modalTheme: "dark",
      });
      console.log("Connection data: ", connectionData);
      if (
        connectionData?.account?.provider?.baseUrl.startsWith(
          "http://localhost"
        )
      ) {
        if (selectedNetwork !== devnetUrl) {
          setIsWrongNetwork(true);
        } else {
          setIsWrongNetwork(false);
          setConnection({
            connected: true,
            account: {
              ...connectionData.account,
              icon: connectionData?.icon || "",
            } as Account,
            provider: connectionData?.account?.provider,
          });
        }
      } else {
        console.log(
          "ChainId",
          networkEquivalents.get(connectionData?.account?.provider?.chainId)
        );
        console.log("Selected network", selectedNetwork);
        if (
          // This is flaky.
          networkEquivalents.get(
            connectionData?.account?.provider?.chainId ||
              constants.StarknetChainId.SN_GOERLI
          ) === selectedNetwork
        ) {
          setIsWrongNetwork(false);
          setConnection({
            connected: true,
            account: {
              address: connectionData?.selectedAddress || "",
              icon: connectionData?.icon || "",
            } as Account,
            provider: connectionData?.account?.provider,
          });
        } else {
          setIsWrongNetwork(true);
        }
      }
    } catch (error) {
      console.log("Error connecting wallet: ", error);
    }
  };

  const handleDisconnectWallet = async () => {
    console.log("Disconnecting wallet from " + selectedNetwork);
    try {
      await disconnect({ clearLastWallet: true });
      setIsWrongNetwork(false);
    } catch (error) {
      console.log("Error disconnecting wallet: ", error);
    }
    // Erase connection data anyway.
    setConnection({
      connected: false,
      account: undefined,
      provider: undefined,
    });
  };

  return (
    <>
      <div className="flex">
        <label className="">Network</label>
        {networkSelect}
      </div>
      {isWrongNetwork && (
        <div className="mt-3">
          <i>
            You're trying to connect to the wrong network, kindly change it in
            your wallet
          </i>
        </div>
      )}
      <div className="">
        <div>
          {!connected && (
            <button
              className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3"
              onClick={handleConnectWallet}
            >
              <div className="d-flex align-items-center justify-content-center">
                <div className="text-truncate overflow-hidden text-nowrap">
                  <span>Connect wallet</span>
                </div>
              </div>
            </button>
          )}
          {connected && (
            <button
              className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3"
              onClick={handleDisconnectWallet}
            >
              <div className="d-flex align-items-center justify-content-center">
                <div className="text-truncate overflow-hidden text-nowrap flex align-items-center">
                  {account && account.icon && (
                    <img
                      src={account.icon}
                      alt="Wallet icon"
                      className="mr-1"
                      width="16px"
                      height="16px"
                    />
                  )}
                  <span>Disconnect {shortenedAddress}</span>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default Connection;
