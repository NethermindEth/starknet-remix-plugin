import { atom } from "jotai";
import { type AccountInterface, type ProviderInterface } from "starknet";

import { type StarknetWindowObject } from "@starknet-io/get-starknet-core";

const devnetAccountAtom = atom<AccountInterface | null>(null);
const devnetProviderAtom = atom<ProviderInterface | null>(null);
const devnetStarknetWindowObjectAtom = atom<StarknetWindowObject | null>(null);

export { devnetAccountAtom, devnetProviderAtom, devnetStarknetWindowObjectAtom };
