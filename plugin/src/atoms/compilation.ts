// status: 'Compiling...' as string,
//   setStatus: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>,

import { atom } from "jotai";

enum CompilationStatus {
	Compiling = "Compiling...",
	Success = "Success",
	Error = "Error"
}

const statusAtom = atom<string>(CompilationStatus.Compiling);

const currentFilenameAtom = atom<string>("");

const noFileSelectedAtom = atom<boolean>(false);

const tomlPathsAtom = atom<string[]>([]);

const activeTomlPathAtom = atom<string>("");

export {
	CompilationStatus,
	statusAtom,
	currentFilenameAtom,
	noFileSelectedAtom,
	tomlPathsAtom,
	activeTomlPathAtom
};
