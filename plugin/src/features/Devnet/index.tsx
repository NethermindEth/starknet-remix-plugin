import { useContext, useEffect, useState } from "react";
import { Card } from "../../components/Card";
import copy from "copy-to-clipboard";
import DevnetAccountSelector from "../../components/DevnetAccountSelector";
import DevnetSelector from "../../components/DevnetSelector";
import "./styles.css";
import { DevnetContext } from "../../contexts/DevnetContext";
import { ConnectionContext } from "../../contexts/ConnectionContext";
import { StarknetWindowObject, connect, disconnect } from "get-starknet";

const trimAddress = (adr: string) => {
  if (adr && adr.startsWith("0x")) {
    const len = adr.length;
    return `${adr.slice(0, 6)}...${adr.slice(len - 6, len)}`;
  }
  return adr;
};

const makeVoyagerLink = async (starknetObj?: StarknetWindowObject | null) => {
  if (starknetObj) {
    const chainId = await starknetObj?.account?.getChainId();
    if (chainId === "0x534e5f4d41494e") {
      return `https://goerli.voyager.online/contract/${starknetObj?.account?.address}`;
    } else {
      return `https://voyager.online/contract/${starknetObj?.account?.address}`;
    }
  }
  return "https://voyager.online";
};

interface ConnectionProps {}

function WalletAccountInfo() {
  const { starknetWindowObject, setStarknetWindowObject } =
    useContext(ConnectionContext);

  async function refreshWalletHandler() {
    disconnect({ clearLastWallet: true });
    setStarknetWindowObject(
      await connect({ modalMode: "alwaysAsk", modalTheme: "system" })
    );
  }

  const [showCopied, setCopied] = useState(false);

  const [voyagerLink, setVoyagerLink] = useState("");

  useEffect(() => {
    (async () => {
      const link = await makeVoyagerLink(starknetWindowObject);
      setVoyagerLink(link);
    })();
  }, [starknetWindowObject]);

  return (
    <div
      className="flex"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <button
        className="btn btn-primary mt-2 mb-2"
        onClick={refreshWalletHandler}
      >
        Reconnect
      </button>
      <div className="wallet-wrapper">
        <img src={starknetWindowObject?.icon} alt="wallet icon" />
        <p className="text"> {starknetWindowObject?.id}</p>
      </div>
      <div className="account-wrapper">
        <span>
          <p
            className="text account"
            title={starknetWindowObject?.account?.address}
          >
            {trimAddress(starknetWindowObject?.account?.address || "")}
          </p>
          <button
            className="btn"
            onClick={() => {
              copy(starknetWindowObject?.account?.address || "");
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
              }, 1000);
            }}
          >
            <svg
              stroke="currentColor"
              fill="none"
              stroke-width="2"
              viewBox="0 0 24 24"
              stroke-linecap="round"
              stroke-linejoin="round"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          {showCopied && <p>Copied</p>}
        </span>
        <a href={voyagerLink} target="_blank" rel="noopnener noreferer">
          View on Voyager
        </a>
      </div>
    </div>
  );
}

function Devnet(_: ConnectionProps) {
  const { devnetEnv } = useContext(DevnetContext);
  return (
    <div className="starknet-connection-component mb-8">
      <Card header="Environment">
        <div className="flex">
          <label className="">Environment selection</label>
          <DevnetSelector />
        </div>
        <div className="flex">
          {devnetEnv ? <DevnetAccountSelector /> : <WalletAccountInfo />}
        </div>
      </Card>
    </div>
  );
}

export { Devnet };
