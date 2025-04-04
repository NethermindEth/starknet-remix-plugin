
export const nethermindDevnet = {
	id: 5050,
	network: "devnet",
	name: "Nethermind Starknet Devnet",
	nativeCurrency: {
		address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
		name: "Ether",
		symbol: "ETH",
		decimals: 18,
	},
	testnet: true,
	rpcUrls: {
		default: {
			http: ["http://starknet-remix-devnet.nethermind.io/"],
		},
		public: {
			http: ["http://starknet-remix-devnet.nethermind.io/"],
		},
	},
};