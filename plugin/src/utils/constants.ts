import { constants } from "starknet";
import { type Status } from "../atoms/deployment";

const devnetUrl = "http://127.0.0.1:5050";

type Network = "sepolia" | "mainnet";

const networks = [
	{
		name: "Sepolia",
		value: "sepolia"
	},
	{
		name: "Mainnet",
		value: "mainnet"
	}
];

const networkExplorerUrls = {
	voyager: {
		sepolia: "https://sepolia.voyager.online",
		mainnet: "https://voyager.online"
	},
	starkscan: {
		sepolia: "https://sepolia.starkscan.co",
		mainnet: "https://starkscan.co"
	}
};

const networkEquivalents = new Map([
	["sepolia", constants.StarknetChainId.SN_SEPOLIA],
	["mainnet", constants.StarknetChainId.SN_MAIN]
]);

const networkEquivalentsRev = new Map([
	[constants.StarknetChainId.SN_SEPOLIA, "sepolia"],
	[constants.StarknetChainId.SN_MAIN, "mainnet"]
]);

export const SCARB_VERSION_REF = "c4c7c0bac3a30c23a4e2f1db145b967371b0e3c2";

export const DeclareStatusLabels: Record<Status, string> = {
	IDLE: "Idle",
	IN_PROGRESS: "Declaring...",
	ERROR: "Error",
	DONE: "Done"
};

export {
	devnetUrl,
	networks,
	networkExplorerUrls,
	networkEquivalents,
	networkEquivalentsRev,
	constants
};

export type { Network };
