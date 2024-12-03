import { atom } from "jotai";
import { type CallDataObject, type Input } from "../utils/types/contracts";

export type Status = "IDLE" | "IN_PROGRESS" | "ERROR" | "DONE";
const isDeployingAtom = atom<boolean>(false);

const deployStatusAtom = atom<Status>("IDLE");

const isDelcaringAtom = atom<boolean>(false);

const declStatusAtom = atom<Status>("IDLE");

const constructorCalldataAtom = atom<CallDataObject>({});

const constructorInputsAtom = atom<Input[]>([]);

const notEnoughInputsAtom = atom<boolean>(false);

const declTxHashAtom = atom<string>("");

const deployTxHashAtom = atom<string>("");

type Key =
	| "isDeploying"
	| "deployStatus"
	| "isDeclaring"
	| "declStatus"
	| "constructorCalldata"
	| "constructorInputs"
	| "notEnoughInputs"
	| "declTxHash"
	| "deployTxHash";

interface SetDeploymentAtom {
	key: Key;
	value: string | boolean | CallDataObject | Input[];
}

const deploymentAtom = atom(
	(get) => {
		return {
			isDeploying: get(isDeployingAtom),
			deployStatus: get(deployStatusAtom),
			isDeclaring: get(isDelcaringAtom),
			declStatus: get(declStatusAtom),
			constructorCalldata: get(constructorCalldataAtom),
			constructorInputs: get(constructorInputsAtom),
			notEnoughInputs: get(notEnoughInputsAtom),
			declTxHash: get(declTxHashAtom),
			deployTxHash: get(deployTxHashAtom)
		};
	},
	(_get, set, newValue: SetDeploymentAtom) => {
		switch (newValue?.key) {
			case "isDeploying":
				typeof newValue?.value === "boolean" && set(isDeployingAtom, newValue?.value);
				break;
			case "deployStatus":
				typeof newValue?.value === "string" &&
					set(deployStatusAtom, newValue?.value as Status);
				break;
			case "isDeclaring":
				typeof newValue?.value === "boolean" && set(isDelcaringAtom, newValue?.value);
				break;
			case "declStatus":
				typeof newValue?.value === "string" &&
					set(declStatusAtom, newValue?.value as Status);
				break;
			case "constructorCalldata":
				typeof newValue?.value === "object" &&
					!Array.isArray(newValue?.value) &&
					set(constructorCalldataAtom, newValue?.value);
				break;
			case "constructorInputs":
				Array.isArray(newValue?.value) && set(constructorInputsAtom, newValue?.value);
				break;
			case "notEnoughInputs":
				typeof newValue?.value === "boolean" && set(notEnoughInputsAtom, newValue?.value);
				break;
			case "declTxHash":
				typeof newValue?.value === "string" && set(declTxHashAtom, newValue?.value);
				break;
			case "deployTxHash":
				typeof newValue?.value === "string" && set(deployTxHashAtom, newValue?.value);
				break;
		}
	}
);

export {
	isDeployingAtom,
	deployStatusAtom,
	isDelcaringAtom,
	declStatusAtom,
	constructorCalldataAtom,
	constructorInputsAtom,
	notEnoughInputsAtom,
	deploymentAtom,
	declTxHashAtom,
	deployTxHashAtom
};
