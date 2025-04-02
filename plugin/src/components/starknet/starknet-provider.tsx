import React from "react";
import { sepolia, mainnet } from "@starknet-react/chains";
import {
	StarknetConfig,
	publicProvider,
} from "@starknet-react/core";
import { availableConnectors } from "./connectors";

export function StarknetProvider({ children }: { children: React.ReactNode }): React.ReactElement {
	return (
		<StarknetConfig
			chains={[mainnet, sepolia]}
			provider={publicProvider()}
			connectors={availableConnectors}
		>
			{children}
		</StarknetConfig>
	);
}
