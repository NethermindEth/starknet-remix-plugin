import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";

export const ARGENT_WEBWALLET_URL =
  process.env.NEXT_PUBLIC_ARGENT_WEBWALLET_URL ?? "https://web.argent.xyz";

export const availableConnectors = [
	new InjectedConnector({ options: { id: "argentX" } }),
	new InjectedConnector({ options: { id: "braavos" } }),
	new WebWalletConnector({ url: ARGENT_WEBWALLET_URL })
];
