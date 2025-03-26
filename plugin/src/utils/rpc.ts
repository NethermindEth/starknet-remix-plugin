import type { Contract } from "./types/contracts";
import type { ProviderInterface } from "starknet";

const emptyEntryPoints = {
	CONSTRUCTOR: [],
	EXTERNAL: [],
	L1_HANDLER: []
};

export async function fetchContractClass(
	provider: ProviderInterface,
	classHash: string,
): Promise<Contract | null> {
	try {
		const result = await provider.getClassByHash(classHash);
		if (result !== undefined && result !== null) {
			return {
				name: "Contract from RPC",
				abi: JSON.parse(JSON.stringify(result.abi)),
				classHash,
				compiledClassHash: "",
				address: "",
				sierraClassHash: "",
				sierra: {
					prime: "0x0",
					compiler_version: "0.0.0",
					bytecode: [],
					hints: [],
					entry_points_by_type: emptyEntryPoints
				},
				casm: {
					prime: "0x0",
					compiler_version: "0.0.0",
					bytecode: [],
					hints: [],
					entry_points_by_type: emptyEntryPoints
				},
				deployedInfo: [],
				declaredInfo: []
			};
		}
		return null;
	} catch (error) {
		console.error("Error fetching contract class:", error);
		return null;
	}
}

export async function fetchClassHashAt(
	provider: ProviderInterface,
	contractAddress: string,
): Promise<string | null> {
	try {
		const result = await provider.getClassHashAt(contractAddress);
		if (result !== undefined) {
			return result;
		}
		return null;
	} catch (error) {
		console.error("Error fetching class hash:", error);
		return null;
	}
}
