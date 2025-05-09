import { type networkExplorerUrls as EXPLORERS } from "../utils/constants";
import { atom } from "jotai";

export const currentExplorerAtom = atom<keyof typeof EXPLORERS>("voyager");
