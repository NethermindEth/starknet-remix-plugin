// Set of functions I thought I might need to use in the future.
// TODO: erase if not neeeded.

import { RpcProvider } from "starknet";
import { devnetUrl } from "./constants";

const getProvider = (network: string): RpcProvider => {
	switch (network) {
		case "mainnet":
			return new RpcProvider({
				nodeUrl: "https://sequencer.starknet.io"
			});
		case "goerli":
			return new RpcProvider({
				nodeUrl: "https://rpc.starknet-testnet.lava.build"
			});
		case "sepolia":
			return new RpcProvider({
				nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno"
			});
		case devnetUrl:
			return new RpcProvider({
				// TODO: Let user chose port eventually.
				nodeUrl: devnetUrl
			});
		default:
			return new RpcProvider({
				nodeUrl: "https://rpc.starknet-testnet.lava.build"
			});
	}
};

interface IExplorerSelector {
	path?: string;
	text?: string;
	title?: string;
	isInline?: boolean;
	isNetworkVisible?: boolean;
	isTextVisible?: boolean;
	controlHook: IUseCurrentExplorer;
}

interface IUseCurrentExplorer {
	explorer: "voyager" | "starkscan";
	setExplorer: React.Dispatch<React.SetStateAction<"voyager" | "starkscan">>;
}

export { getProvider, type IExplorerSelector, type IUseCurrentExplorer };

function isEmpty(str: string | undefined): boolean {
	return str === "" || str === null || str === undefined;
}

export { isEmpty };
