import { createContext } from "react";
import { Connection } from "../types/accounts";

const ConnectionContext = createContext({
  connection: {
    connected: false,
    account: undefined,
    provider: undefined,
  } as Connection,
  setConnection: (connection: Connection) => {},
});

export { ConnectionContext };
