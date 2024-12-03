import { type DevnetAccount } from "./types/accounts";

const apiUrl: string = import.meta.env.VITE_API_URL ?? "cairo-compile-remix-test.nethermind.io";
const devnetUrl: string = import.meta.env.VITE_DEVNET_URL ?? "http://localhost:5050";
const remoteDevnetUrl: string =
	import.meta.env.VITE_REMOTE_DEVNET_URL ?? "https://starknet-remix-devnet.nethermind.io";

interface Devnet {
	name: string;
	url: string;
}

const devnets: Devnet[] = [
	{
		name: "Local Devnet",
		url: devnetUrl
	},
	{
		name: "Remote Devnet",
		url: remoteDevnetUrl
	},
	{
		name: "Local Katana Devnet",
		url: devnetUrl
	}
];

const getAccounts = async (
	customDevnetUrl: string = devnetUrl,
	isKatana: boolean = false
): Promise<DevnetAccount[]> => {
	try {
		if (isKatana) {
			const response = await fetch(`${customDevnetUrl}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					jsonrpc: "2.0",
					method: "katana_predeployedAccounts",
					params: [],
					id: 1
				})
			});
			const jsonResp = await response.json();
			const accounts: DevnetAccount[] = jsonResp.result;
			return accounts;
		}
		const response = await fetch(`${customDevnetUrl}/predeployed_accounts`);
		const accounts: DevnetAccount[] = await response.json();
		return accounts;
	} catch (error) {
		console.error(error);
		return [];
	}
};

export {
	apiUrl,
	devnetUrl,
	devnets,
	getAccounts
};

export type { Devnet, DevnetAccount };
