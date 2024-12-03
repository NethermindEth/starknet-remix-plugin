import { atomWithStorage } from "jotai/utils";
import { type AbiElement, type Input } from "../utils/types/contracts";
import { type InvokeFunctionResponse, type CallContractResponse } from "starknet";

const STORAGE_KEYS = {
	INTERACT: "INTERACT"
};

export type EnhancedInput = Input & {
	rawInput?: string;
};

export type EnhancedAbiElement = Omit<AbiElement, "inputs"> & {
	callResponse?: CallContractResponse;
	invocationResponse?: InvokeFunctionResponse;
	inputs: EnhancedInput[];
};

export interface UiAbiState {
	readState: EnhancedAbiElement[];
	writeState: EnhancedAbiElement[];
}

const interactAtom = atomWithStorage<Record<string, UiAbiState>>(STORAGE_KEYS.INTERACT, {});

export { interactAtom };
