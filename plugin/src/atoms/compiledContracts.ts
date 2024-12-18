import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { type Contract } from "../utils/types/contracts";

const compiledContractsAtom = atomWithStorage<Contract[]>(
	"contracts",
	[],
	// use localStorage
	undefined,
	// fetch saved data on initialization
	{ getOnInit: true }
);

const selectedCompiledContract = atom<Contract | null>(null);

const deployedContractsAtom = atomWithStorage<Contract[]>(
	"deployedContracts",
	[],
	// use localStorage
	undefined,
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
