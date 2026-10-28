import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { createSafeJSONStorage } from "../utils/storage";
import { type Contract } from "../utils/types/contracts";

const compiledContractsAtom = atomWithStorage<Contract[]>(
	"contracts",
	[],
	// use localStorage, falling back to memory where the browser blocks it
	createSafeJSONStorage<Contract[]>(),
	// fetch saved data on initialization
	{ getOnInit: true }
);

const selectedCompiledContract = atom<Contract | null>(null);

const deployedContractsAtom = atomWithStorage<Contract[]>(
	"deployedContracts",
	[],
	// use localStorage, falling back to memory where the browser blocks it
	createSafeJSONStorage<Contract[]>(),
	// fetch saved data on initialization
	{ getOnInit: true }
);

const selectedDeployedContract = atom<Contract | null>(null);

export {
	compiledContractsAtom,
	deployedContractsAtom,
	selectedCompiledContract,
	selectedDeployedContract
};
