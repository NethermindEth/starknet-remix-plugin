import { useContext } from "react";
import { Card } from "../../components/Card";
import DevnetAccountSelector from "../../components/DevnetAccountSelector";
import DevnetSelector from "../../components/DevnetSelector";
import "./styles.css";
import { DevnetContext } from "../../contexts/DevnetContext";
import { ConnectionContext } from "../../contexts/ConnectionContext";
import { connect, disconnect } from "get-starknet";


interface ConnectionProps {}

function WalletAccountInfo() {
  const {starknetWindowObject, setStarknetWindowObject} = useContext(ConnectionContext);

  async function refreshWalletHandler(){
    disconnect({clearLastWallet: true});
    setStarknetWindowObject(await connect({modalMode:"alwaysAsk", "modalTheme":"system"}));
  }

  return (
  <div className="flex">
    <button className="btn btn-primary" onClick={refreshWalletHandler}> refresh </button>
    <label className="">Using</label>
    <label className="">Wallet : {starknetWindowObject?.id}</label>
    <label className="">Account : {starknetWindowObject?.account?.address}</label>
  </div>
  );
}

function Devnet(_: ConnectionProps) {
  const {devnetEnv} = useContext(DevnetContext);
  return (
    <div className="starknet-connection-component mb-8">
      <Card header="Environment">
        <div className="flex">
          <label className="">Environment selection</label>
          <DevnetSelector />
        </div>
        <div className="flex">
          <label className="">Devnet account selection</label>
          { devnetEnv ? <DevnetAccountSelector /> : <WalletAccountInfo />}
        </div>
      </Card>
    </div>
  );
}

export { Devnet };
