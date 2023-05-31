// A component that reads the compiled contracts from the context and displays them in a select

import { useContext } from "react";
import { DevnetContext } from "../../contexts/DevnetContext";
import { devnets, getDevnetIndex } from "../../utils/network";
import { ConnectionContext } from "../../contexts/ConnectionContext";
import { connect, disconnect } from "get-starknet";

interface DevnetSelectorProps {}

function DevnetSelector(_: DevnetSelectorProps) {
  const { devnet, setDevnet , setDevnetEnv} =
    useContext(DevnetContext);

  
  const {starknetWindowObject, setStarknetWindowObject} = useContext(ConnectionContext);


  async function handleEnvironmentChange(event: any) {
    if(event.target.value < devnets.length){
      setDevnet(devnets[event.target.value]);
      setDevnetEnv(true);
      disconnect({clearLastWallet: true});
      return;
    }
    setDevnetEnv(false);
    if(!(starknetWindowObject && starknetWindowObject.isConnected)){
      setStarknetWindowObject(await connect({modalMode:"alwaysAsk", "modalTheme":"system"}));
    }
  }

  return (
    <select
      className="custom-select"
      aria-label=".form-select-sm example"
      onChange={handleEnvironmentChange}
      defaultValue={getDevnetIndex(devnets, devnet)}
    >
      {
        devnets.reduce((acc, devnet, index) => {
          acc.push(
            <option value={index} key={index}>
              {devnet.name}
            </option>
          );
          return acc;
        }, [
          <option value={devnets.length} key={devnets.length}>
            Injected Wallet Provider
          </option>
        ] as JSX.Element[])
      }
    </select>
  );
}

export default DevnetSelector;
