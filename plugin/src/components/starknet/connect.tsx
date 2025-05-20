import { type Connector, useConnect } from "@starknet-react/core";
import React from "react";
import {
	type StarknetkitConnector,
	useStarknetkitConnectModal
} from "starknetkit";
import { availableConnectors } from "./connectors";
import { MdAccountBalanceWallet } from "react-icons/md";

const ConnectModal = (): React.ReactElement => {
	const { connectAsync } = useConnect();

	const { starknetkitConnectModal } = useStarknetkitConnectModal({
		connectors: availableConnectors as StarknetkitConnector[]
	});

	// https://nextjs.org/docs/messages/react-hydration-error#solution-1-using-useeffect-to-run-on-the-client-only
	// starknet react had an issue with the `available` method
	// need to check their code, probably is executed only on client causing an hydration issue

	const handleStarknetkitClick = async (): Promise<void> => {
		const { connector } = await starknetkitConnectModal();
		if (connector == null) return; // or throw error
		await connectAsync({ connector: connector as Connector });
	};

	return (
		<div style={{ display: "flex", flexDirection: "column" }}>
			<button
				onClick={() => {
					handleStarknetkitClick().catch(console.error);
				}}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "flex-start",
					cursor: "pointer",
					gap: "0.5rem",
					padding: "8px 16px",
					backgroundColor: "var(--bgPrimary)",
					border: "1px solid var(--secondary)",
					borderRadius: "4px",
					fontSize: "14px"
				}}
			>
				<MdAccountBalanceWallet size={24} />
				Connect with Starknetkit
			</button>
		</div>
	);
};

export default ConnectModal;
