import React from "react";
import { sepolia, goerli, mainnet } from "@starknet-react/chains";
import {
	StarknetConfig,
	publicProvider,
	argent,
	braavos,
	useInjectedConnectors
} from "@starknet-react/core";

export function StarknetProvider({ children }: { children: React.ReactNode }): JSX.Element {
	const { connectors } = useInjectedConnectors({
		// Show these connectors if the user has no connector installed.
		recommended: [argent(), braavos()],
		// Hide recommended connectors if the user has any connector installed.
		includeRecommended: "onlyIfNoConnectors",
		// Randomize the order of the connectors.
		order: "random"
	});

	return (
		<StarknetConfig
			chains={[mainnet, goerli, sepolia]}
			provider={publicProvider()}
			connectors={connectors}
		>
			{children}
		</StarknetConfig>
	);
}
