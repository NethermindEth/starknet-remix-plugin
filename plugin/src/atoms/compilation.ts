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

type Keys =
	| "status"
	| "currentFilename"
	| "isCompiling"
	| "isValidCairo"
	| "noFileSelected"
	| "hashDir"
	| "tomlPaths"
	| "activeTomlPath";

interface SetCompilationValue {
	key: Keys;
	value: string | boolean | string[];
}

const compilationAtom = atom(
	(get) => {
		return {
			status: get(statusAtom),
			currentFilename: get(currentFilenameAtom),
			noFileSelected: get(noFileSelectedAtom),
			tomlPaths: get(tomlPathsAtom),
			activeTomlPath: get(activeTomlPathAtom)
		};
	},
	(_get, set, newValue: SetCompilationValue) => {
		switch (newValue?.key) {
			case "status":
				typeof newValue?.value === "string" && set(statusAtom, newValue?.value);
				break;
			case "currentFilename":
				typeof newValue?.value === "string" && set(currentFilenameAtom, newValue?.value);
				break;
			case "noFileSelected":
				typeof newValue?.value === "boolean" && set(noFileSelectedAtom, newValue?.value);
				break;
			case "tomlPaths":
				Array.isArray(newValue?.value) && set(tomlPathsAtom, newValue?.value);
				break;
			case "activeTomlPath":
				typeof newValue?.value === "string" && set(activeTomlPathAtom, newValue?.value);
				break;
		}
	}
);

export {
	CompilationStatus,
	compilationAtom
};
