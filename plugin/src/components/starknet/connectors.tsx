import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";
import { NethermindDevnetConnector } from "./devnet-connector";

export const availableConnectors = [
	new InjectedConnector({
	  options: { id: "argentX", name: "Argent X" },
	}),
	new InjectedConnector({
	  options: { id: "braavos", name: "Braavos" },
	}),
	new WebWalletConnector({ url: "https://web.argent.xyz" }),
	new NethermindDevnetConnector( ),
];