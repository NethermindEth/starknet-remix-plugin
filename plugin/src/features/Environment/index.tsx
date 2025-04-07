import React, { useEffect } from "react";
import DevnetAccountSelector from "../../components/DevnetAccountSelector";
import "./styles.css";
import EnvironmentSelector from "../../components/EnvironmentSelector";
import Wallet from "../../components/Wallet";
import { useAtomValue } from "jotai";
import { availableDevnetAccountsAtom, envAtom } from "../../atoms/environment";
import * as Accordion from "@radix-ui/react-accordion";
import { CurrentEnv } from "../../components/CurrentEnv";
import { BsChevronDown } from "react-icons/bs";
import { DevnetAccountStore } from "../../components/starknet/devnet-connector";
import { Account } from "starknet";
import { RpcProvider } from "starknet";
import { devnet } from "@starknet-react/chains";

const DEVNET_ENVIRONMENTS: string[] = ["customDevnet", "remoteDevnet", "localKatanaDevnet"];

const EnvSettings: React.FC<{ env: string }> = ({ env }) => {
	const isDevnetEnv = DEVNET_ENVIRONMENTS.includes(env);

	return (
		<div className="flex flex-column">
			<div>
				<div className="flex flex-column">
					<label htmlFor="env-selector">Environment selection</label>
					<div className="flex_dot">
						<div className="env-selector-wrapper">
							<EnvironmentSelector />
						</div>
					</div>
				</div>
				<div className="flex flex-column">
					{isDevnetEnv && <DevnetAccountSelector />}
					<Wallet />
				</div>
			</div>
		</div>
	);
};

const Environment: React.FC = () => {
	const env = useAtomValue(envAtom);

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
