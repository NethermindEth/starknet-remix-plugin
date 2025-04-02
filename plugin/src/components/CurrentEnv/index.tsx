import React from "react";
import "./styles.css";
import { useAtomValue } from "jotai";
import { envAtom, envName, selectedDevnetAccountAtom } from "../../atoms/environment";
import { selectedAccountAtom } from "../../atoms/manualAccount";
import { getShortenedHash } from "../../utils/utils";
import { ethers } from "ethers";
import { DevnetStatus } from "../DevnetStatus";
import { account } from "../../atoms/connection";
import { walletBalanceAtom } from "../Wallet";

export const CurrentEnv: React.FC = () => {
	const env = useAtomValue(envAtom);

	const selectedAccountManual = useAtomValue(selectedAccountAtom);
	const selectedAccountDevnet = useAtomValue(selectedDevnetAccountAtom);
	const walletAccount = useAtomValue(account);
	const walletBalance = useAtomValue(walletBalanceAtom);

	const selectedAccount =
		env === "wallet"
			? {
				address: walletAccount?.address,
				balance: walletBalance !== null && walletBalance !== undefined
					? walletBalance
					: 0
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

	const selectedAccountBalance = ethers.utils.formatEther(selectedAccount.balance ?? 0);

	const balanceValue = parseFloat(selectedAccountBalance);
	const isInteger = Number.isInteger(balanceValue);
	const formattedBalance = isInteger
		? balanceValue.toFixed(0)
		: balanceValue.toFixed(3);

	return (
		<div className={"current-env-root"}>
			<div className={"devnet-status"}>
				<DevnetStatus />
			</div>
			<div className={"chain-info-box"}>
				<span className={"chain-name"}>{envName(env)}</span>
				<span className={"chain-account-info"}>
					{selectedAccountAddress}{" "}
					{selectedAccount !== null && selectedAccount !== undefined ? `(${formattedBalance} ETH)` : ""}
				</span>
			</div>
		</div>
	);
};
