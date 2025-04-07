import React from "react";

import { useDisconnect } from "@starknet-react/core";

export default function DisconnectModal(props: { children?: React.ReactNode; className?: string }): React.ReactElement {
	const { disconnect } = useDisconnect();

	return (
		<div className="w-full flex justify-center">
			<div className="flex flex-col justify-center w-full mr-2">
				<button
					className={`btn btn-warning justify-cente flex-col flex w-full rounded ${props.className || ''}`}
					onClick={() => {
						disconnect();
					}}
				>
					{props.children}
				</button>
			</div>
		</div>
	);
}
