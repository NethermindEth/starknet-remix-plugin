import { StarknetWindowObject } from "get-starknet";
import { createContext } from "react";

const ConnectionContext = createContext({
  starknetWindowObject: null as StarknetWindowObject | null, 
  setStarknetWindowObject: (_: StarknetWindowObject | null) => {},
});

export { ConnectionContext };
