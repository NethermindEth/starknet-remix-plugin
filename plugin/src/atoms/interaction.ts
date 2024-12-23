import { atom } from "jotai";

const invokeTxHashAtom = atom<string>("");

const isInvokingAtom = atom<boolean>(false);

export { invokeTxHashAtom, isInvokingAtom };
