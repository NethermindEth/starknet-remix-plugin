// status: 'Compiling...' as string,
//   setStatus: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>,

import { atom } from "jotai";

const statusAtom = atom<string>("Compiling....");

//   currentFilename: '' as string,
//   setCurrentFilename: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>,

const currentFilenameAtom = atom<string>("");
//   isCompiling: false as boolean,
//   setIsCompiling: ((_: boolean) => {}) as React.Dispatch<React.SetStateAction<boolean>>,

const isCompilingAtom = atom<boolean>(false);

//   isValidCairo: false as boolean,
//   setIsValidCairo: ((_: boolean) => {}) as React.Dispatch<React.SetStateAction<boolean>>,

const isValidCairoAtom = atom<boolean>(false);
//   noFileSelected: false as boolean,
//   setNoFileSelected: ((_: boolean) => {}) as React.Dispatch<React.SetStateAction<boolean>>,

const noFileSelectedAtom = atom<boolean>(false);
//   hashDir: '' as string,
//   setHashDir: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>,

const hashDirAtom = atom<string>("");

//   tomlPaths: [] as string[],
//   setTomlPaths: ((_: string[]) => {}) as React.Dispatch<React.SetStateAction<string[]>>,
const tomlPathsAtom = atom<string[]>([]);

//   activeTomlPath: '' as string,
//   setActiveTomlPath: ((_: string) => {}) as React.Dispatch<React.SetStateAction<string>>
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
			isCompiling: get(isCompilingAtom),
			isValidCairo: get(isValidCairoAtom),
			noFileSelected: get(noFileSelectedAtom),
			hashDir: get(hashDirAtom),
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
			case "isCompiling":
				typeof newValue?.value === "boolean" && set(isCompilingAtom, newValue?.value);
				break;
			case "isValidCairo":
				typeof newValue?.value === "boolean" && set(isValidCairoAtom, newValue?.value);
				break;
			case "noFileSelected":
				typeof newValue?.value === "boolean" && set(noFileSelectedAtom, newValue?.value);
				break;
			case "hashDir":
				typeof newValue?.value === "string" && set(hashDirAtom, newValue?.value);
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
	statusAtom,
	currentFilenameAtom,
	isCompilingAtom,
	isValidCairoAtom,
	noFileSelectedAtom,
	hashDirAtom,
	tomlPathsAtom,
	activeTomlPathAtom,
	compilationAtom
};
