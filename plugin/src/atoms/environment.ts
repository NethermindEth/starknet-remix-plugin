import { atom } from "jotai";

import { type Devnet, devnets, type DevnetAccount } from "../utils/network";

const devnetAtom = atom<Devnet>(devnets[1]);
const customDevnetUrlAtom = atom<string>("http://localhost:5050");
const isCustomDevnetConnectedAtom = atom<boolean>(true);

export type Env = "remoteDevnet" | "wallet" | "customDevnet" | "localKatanaDevnet";

export const envName = (env: Env): string => {
	switch (env) {
		case "remoteDevnet":
			return "Remote Devnet";
		case "wallet":
			return "Wallet";
		case "customDevnet":
			return "Custom Devnet";
		case "localKatanaDevnet":
			return "Local Katana Devnet";
		default:
			return "Unknown";
	}
};

const envAtom = atom<Env>("remoteDevnet");

const isDevnetAliveAtom = atom<boolean>(true);

const availableDevnetAccountsAtom = atom<DevnetAccount[]>([]);

export {
	devnetAtom,
	customDevnetUrlAtom,
	isCustomDevnetConnectedAtom,
	envAtom,
	isDevnetAliveAtom,
	availableDevnetAccountsAtom
};
