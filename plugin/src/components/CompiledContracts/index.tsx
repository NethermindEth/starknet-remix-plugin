// A component that reads the compiled contracts from the context and displays them in a select

import { useContext } from "react";
import { CompiledContractsContext } from "../../contexts/CompiledContractsContext";
import {
  getContractNameFromFullName,
  getSelectedContractIndex,
  getShortenedHash,
} from "../../utils/utils";

interface CompiledContractsProps {}

function CompiledContracts(props: CompiledContractsProps) {
  const { contracts, selectedContract, setSelectedContract } = useContext(
    CompiledContractsContext
  );

  function handleCompiledContractSelectionChange(event: any) {
    setSelectedContract(contracts[event.target.value]);
  }

  return (
    <select
      className="custom-select"
      aria-label=".form-select-sm example"
      onChange={handleCompiledContractSelectionChange}
      defaultValue={getSelectedContractIndex(contracts, selectedContract)}
    >
      {contracts.map((contract, index) => {
        return (
          // TODO: Set the contract name to name + index to avoid duplicates.
          <option value={index} key={index}>
            {`${getContractNameFromFullName(contract.name)} (${getShortenedHash(
              contract.classHash || "",
              6,
              4
            )})`}
          </option>
        );
      })}
    </select>
  );
}

export default CompiledContracts;
