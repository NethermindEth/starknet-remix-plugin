import { BigNumber } from "ethers";

enum StarknetChainId {
	SN_MAIN = "0x534e5f4d41494e",
	SN_GOERLI = "0x534e5f474f45524c49",
	SN_SEPOLIA = "0x534e5f5345504f4c4941",
}

export function getChainName (chainId: string): string {
	chainId = BigNumber.from(chainId).toHexString();
	switch (chainId) {
		case StarknetChainId.SN_MAIN:
			return "mainnet";
		case StarknetChainId.SN_GOERLI:
			return "goerli";
		case StarknetChainId.SN_SEPOLIA:
			return "sepolia";
		default:
			return "unknown";
	}
}

export const formatWalletAddress = (address: string | undefined): string | undefined => {
	if (address === undefined) return undefined;
	if (!address.startsWith("0x")) {
		throw new Error("Invalid address format");
	}

	const hexPart = address.slice(2);
	if (hexPart.length === 64) {
		return address;
	}

	const paddedHexPart = hexPart.padStart(64, "0");
	return "0x" + paddedHexPart;
};
