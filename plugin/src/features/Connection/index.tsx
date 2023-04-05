import { connect, disconnect } from "get-starknet";
import { useState } from "react";
import "./styles.css";

interface ConnectionProps {
  onConnectionChange: (connected: boolean, account: any, provider: any) => void;
}

function Connection({ onConnectionChange }: ConnectionProps) {
  const [connected, setConnected] = useState(false);

  const handleConnectWallet = async () => {
    try {
      const connectionData = await connect({
        modalMode: "alwaysAsk",
        modalTheme: "dark",
      });
      setConnected(true);
      onConnectionChange(
        true,
        {
          address: connectionData?.selectedAddress || "",
          icon: connectionData?.icon || "",
        },
        connectionData?.account?.provider
      );
    } catch (error) {
      console.log("Error connecting wallet: ", error);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect({ clearLastWallet: true });
      setConnected(false);
      onConnectionChange(false, { address: "", icon: "" }, null);
    } catch (error) {
      console.log("Error disconnecting wallet: ", error);
    }
  };

  return (
    <>
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
              <span>Disconnect wallet</span>
            </div>
          </div>
        </button>
      )}
    </>
  );
}

export default Connection;
