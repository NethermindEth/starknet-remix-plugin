import { atom } from "jotai";
import { type TestEngine } from "../utils/api";

const testEngineAtom = atom<TestEngine | null>("scarb");

export { testEngineAtom };
