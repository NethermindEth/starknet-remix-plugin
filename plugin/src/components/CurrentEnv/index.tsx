import React from "react";
import "./styles.css";
import { useAtomValue } from "jotai";
import { envAtom, envName } from "../../atoms/environment";
import { ethers } from "ethers";
import { DevnetStatus } from "../DevnetStatus";
import { useAccount } from "@starknet-react/core";
export const CurrentEnv: React.FC = () => {
	const env = useAtomValue(envAtom);
	const { account } = useAccount();

	// TODO: Implement balance fetching
	const selectedAccountBalance = ethers.utils.formatEther(0);

	return (
		// <div>{ envName(env) }, { selectedAccountAddress }, { selectedAccountBalance } ETH </div>
		<div className={"current-env-root"}>
			<div className={"devnet-status"}>
				<DevnetStatus />
			</div>
			<div className={"chain-info-box"}>
				<span className={"chain-name"}>{envName(env)}</span>
				<span className={"chain-account-info"}>
					{account?.address}{" "}
					{account != null ? `(${selectedAccountBalance} ETH)` : ""}
				</span>
			</div>
		</div>
	);
};
