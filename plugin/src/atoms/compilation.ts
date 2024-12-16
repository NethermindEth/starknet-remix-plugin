// status: 'Compiling...' as string,
//   setStatus: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>,

import { atom } from "jotai";

enum CompilationStatus {
	Compiling = "Compiling...",
	Success = "Success",
	Error = "Error",
	Idle = "Idle"
}

const statusAtom = atom<string>(CompilationStatus.Idle);

const currentFilenameAtom = atom<string>("");

const isCompilingAtom = atom<boolean>(false);

const noFileSelectedAtom = atom<boolean>(false);

const tomlPathsAtom = atom<string[]>([]);

const activeTomlPathAtom = atom<string>("");

export {
	CompilationStatus,
	statusAtom,
	currentFilenameAtom,
	noFileSelectedAtom,
	tomlPathsAtom,
	activeTomlPathAtom,
	isCompilingAtom
};
