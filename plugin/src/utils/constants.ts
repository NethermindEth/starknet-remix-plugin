import { InjectedConnector } from "@starknet-react/core";
import { constants } from "starknet";

const connectorIds = ["argentX", "braavos"];

const connectors = connectorIds.map(
  (id) => new InjectedConnector({ options: { id } })
);

const devnetUrl = "http://127.0.0.1:5050";

const networks = [
  { name: "Testnet", value: "goerli-alpha" },
  { name: "Testnet 2", value: "goerli-alpha-2" },
  { name: "Devnet", value: devnetUrl },
  { name: "Mainnet", value: "mainnet-alpha" },
];

const networkEquivalents = new Map([
  [constants.StarknetChainId.SN_GOERLI, "goerli-alpha"],
  [constants.StarknetChainId.SN_GOERLI2, "goerli-alpha-2"],
  [constants.StarknetChainId.SN_MAIN, "mainnet-alpha"],
]);

export { connectors, devnetUrl, networkEquivalents, networks };
