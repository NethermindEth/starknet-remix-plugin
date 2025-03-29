import React from "react";
import "./styles.css";
import { useAtomValue } from "jotai";
import { envAtom, envName, selectedDevnetAccountAtom } from "../../atoms/environment";
import { selectedAccountAtom } from "../../atoms/manualAccount";
import { getShortenedHash } from "../../utils/utils";
import { ethers } from "ethers";
import { DevnetStatus } from "../DevnetStatus";
import { account } from "../../atoms/connection";

export const CurrentEnv: React.FC = () => {
	const env = useAtomValue(envAtom);

	const selectedAccountManual = useAtomValue(selectedAccountAtom);
	const selectedAccountDevnet = useAtomValue(selectedDevnetAccountAtom);
	const walletAccount = useAtomValue(account);
	// const walletProvider = useAtomValue(provider)

	const selectedAccount =
		env === "wallet"
			? {
				address: walletAccount?.address,
				balance: 0
			}
			: env === "manual"
				? {
					address: selectedAccountManual?.address,
					balance: selectedAccountManual?.balance
				}
				: {
					address: selectedAccountDevnet?.address,
					balance: selectedAccountDevnet?.initial_balance
				};

	const selectedAccountAddress =
		selectedAccount.address != null
			? getShortenedHash(selectedAccount.address, 6, 4)
			: "No account selected";

	const balanceInEther = parseFloat(ethers.utils.formatEther(selectedAccount.balance ?? 0));
	const isInteger = Number.isInteger(balanceInEther);
	const selectedAccountBalance = isInteger ? balanceInEther.toFixed(0) : balanceInEther.toFixed(3);

	return (
		// <div>{ envName(env) }, { selectedAccountAddress }, { selectedAccountBalance } ETH </div>
		<div className={"current-env-root"}>
			<div className={"devnet-status"}>
				<DevnetStatus />
			</div>
			<div className={"chain-info-box"}>
				<span className={"chain-name"}>{envName(env)}</span>
				<span className={"chain-account-info"}>
					{selectedAccountAddress}{" "}
					{selectedAccount != null ? `(${selectedAccountBalance} ETH)` : ""}
				</span>
			</div>
		</div>
	);
};
