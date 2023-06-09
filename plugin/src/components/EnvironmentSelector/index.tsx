import { useContext } from "react";
import { Devnet, devnets, getDevnetIndex } from "../../utils/network";
import { ConnectOptions, DisconnectOptions } from "get-starknet";
import { ConnectionContext } from "../../contexts/ConnectionContext";
import { Provider } from "starknet";

interface EnvironmentSelectorProps {
  env: string;
  setEnv: (env: string) => void;
  devnet: Devnet;
  setDevnet: (devnet: Devnet) => void;
  connectWalletHandler: (options?: ConnectOptions) => Promise<void>;
  disconnectWalletHandler: (options?: DisconnectOptions) => Promise<void>;
}

function EnvironmentSelector(props: EnvironmentSelectorProps) {
  const { setProvider } = useContext(ConnectionContext);

  async function handleEnvironmentChange(event: any) {
    if (event.target.value > 0) {
      props.setDevnet(devnets[event.target.value - 1]);
      props.setEnv("devnet");
      props.disconnectWalletHandler();
      setProvider(
        new Provider({
          sequencer: {
            baseUrl: devnets[event.target.value - 1].url,
          },
        })
      );
      return;
    }
    props.setEnv("wallet");
    props.connectWalletHandler();
  }

  return (
    <select
      className="custom-select"
      aria-label=".form-select-sm example"
      onChange={handleEnvironmentChange}
      defaultValue={getDevnetIndex(devnets, props.devnet) + 1}
    >
      {devnets.reduce(
        (acc, devnet, index) => {
          acc.push(
            <option value={index + 1} key={index + 1}>
              {devnet.name}
            </option>
          );
          return acc;
        },
        [
          <option value={0} key={0}>
            Injected Wallet Provider
          </option>,
        ] as JSX.Element[]
      )}
    </select>
  );
}

export default EnvironmentSelector;
