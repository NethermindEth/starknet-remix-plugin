// A component that reads the compiled contracts from the context and displays them in a select

import { useContext } from "react";
import { DevnetContext } from "../../contexts/DevnetContext";
import { devnets, getDevnetIndex } from "../../utils/network";

interface DevnetSelectorProps {}

function DevnetSelector(props: DevnetSelectorProps) {
  const { devnet, setDevnet } =
    useContext(DevnetContext);

  function handleAccountChange(event: any) {
    setDevnet(devnets[event.target.value]);
  }

  return (
    <select
      className="custom-select"
      aria-label=".form-select-sm example"
      onChange={handleAccountChange}
      defaultValue={getDevnetIndex(devnets, devnet)}
    >
      {devnets.map((devnet, index) => {
        return (
          <option value={index} key={index}>
            {devnet.name}
          </option>
        );
      })}
    </select>
  );
}

export default DevnetSelector;
