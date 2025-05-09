import { atom } from "jotai";
import { type ManualAccount } from "../utils/types/accounts";
import { networks } from "../utils/constants";

const accountAtom = atom<ManualAccount[]>([]);

const selectedAccountAtom = atom<ManualAccount | null>(null);

const networkAtom = atom<string>(networks[0].name);

export { accountAtom, selectedAccountAtom, networkAtom };
