import { atom } from "jotai";

const cairoVersionAtom = atom<string | null>(null);

const versionsAtom = atom<string[]>([]);

export { cairoVersionAtom, versionsAtom };
