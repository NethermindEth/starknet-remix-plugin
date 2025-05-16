import { constants } from "starknet";
import { type Status } from "../atoms/deployment";

const devnetUrl = "http://127.0.0.1:5050";

type Network = "goerli" | "sepolia" | "mainnet";

export const RPC_URLS = {
	sepolia: "https://free-rpc.nethermind.io/sepolia-juno/v0_7",
	mainnet: "https://free-rpc.nethermind.io/mainnet-juno/v0_7"
};

export const ETH_TOKEN_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

export const ERC20_ABI = [
	{
		inputs: [
			{
				name: "account",
				type: "felt"
			}
		],
		name: "balanceOf",
		outputs: [
			{
				name: "balance",
				type: "Uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	}
];

const networks = [
	{
		name: "Testnet",
		value: "goerli"
	},
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
		goerli: "https://goerli.voyager.online",
		sepolia: "https://sepolia.voyager.online",
		mainnet: "https://voyager.online"
	},
	starkscan: {
		goerli: "https://testnet.starkscan.co",
		sepolia: "https://sepolia.starkscan.co",
		mainnet: "https://starkscan.co"
	}
};

const networkEquivalents = new Map([
	["goerli", constants.StarknetChainId.SN_GOERLI],
	["sepolia", constants.StarknetChainId.SN_SEPOLIA],
	["mainnet", constants.StarknetChainId.SN_MAIN]
]);

const networkEquivalentsRev = new Map([
	[constants.StarknetChainId.SN_GOERLI, "goerli"],
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
