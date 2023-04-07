import { createContext } from "react";
import { Contract } from "../types/contracts";

const CompiledContractsContext = createContext({
  contracts: [] as Contract[],
  setContracts: (contracts: Contract[]) => {},
  selectedContract: null as Contract | null,
  setSelectedContract: (contract: Contract | null) => {},
});

export { CompiledContractsContext };
