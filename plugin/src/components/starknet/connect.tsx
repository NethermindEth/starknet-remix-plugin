import React from "react";

import { useConnect, type Connector } from "@starknet-react/core";

export default function ConnectModal(): JSX.Element {
	const { connect, connectors } = useConnect();
	return (
		<div className="flex flex-col gap-4">
			{connectors.map((connector: Connector) => (
				<button
					className="btn btn-primary rounded mt-2 mr-3 justify-center"
					key={connector.id}
					onClick={() => {
						connect({ connector });
					}}
					disabled={!connector.available()}
				>
					<div className="wallet-row-wrapper wallet-wrapper">
						Connect {connector.name}
						<img
							className="wallet-wrapper"
							src={connector?.icon?.dark}
							alt="wallet icon"
						/>
					</div>
				</button>
			))}
		</div>
	);
}
