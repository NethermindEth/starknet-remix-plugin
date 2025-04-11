import React, { useEffect } from "react";
import DevnetAccountSelector from "../../components/DevnetAccountSelector";
import "./styles.css";
import Wallet from "../../components/Wallet";
import { useAtomValue } from "jotai";
import { availableDevnetAccountsAtom } from "../../atoms/environment";
import { DevnetAccountStore } from "../../components/starknet/devnet-connector";
import { Account } from "starknet";
import { RpcProvider } from "starknet";
import { devnet } from "@starknet-react/chains";

const EnvSettings: React.FC = () => {
	return (
		<div className="flex flex-column p-2">
			<div>
				<div className="flex flex-column">
					<DevnetAccountSelector />
				</div>
			</div>
		</div>
	);
};

const Environment: React.FC = () => {
	const availableDevnetAccounts = useAtomValue(availableDevnetAccountsAtom);

	// Initialize the devnet account
	useEffect(() => {
		if (availableDevnetAccounts.length === 0) {
			return;
		}

		const newProvider = new RpcProvider({ nodeUrl: devnet.rpcUrls.public.http[0] });

		const newAccount = new Account(
			newProvider,
			availableDevnetAccounts[0].address,
			availableDevnetAccounts[0].private_key
		);

		DevnetAccountStore.getInstance().updateAccount(newAccount);
	}, [availableDevnetAccounts]);

	return (
		<div className="wallet-container">
			<Wallet />
		</div>
	);
};

export { Environment, EnvSettings };
