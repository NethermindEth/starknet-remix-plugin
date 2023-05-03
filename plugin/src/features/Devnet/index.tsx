import { Card } from "../../components/Card";
import DevnetAccountSelector from "../../components/DevnetAccountSelector";
import DevnetSelector from "../../components/DevnetSelector";
import "./styles.css";

interface ConnectionProps {}

function Devnet(props: ConnectionProps) {
  return (
    <div className="starknet-connection-component mb-8">
      <Card header="Connection">
        <div className="flex">
          <label className="">Devnet selection</label>
          <DevnetSelector />
        </div>
        <div className="flex">
          <label className="">Devnet account selection</label>
          <DevnetAccountSelector />
        </div>
      </Card>
    </div>
  );
}

export { Devnet };
