import { hash } from "starknet";

import { type FileContentMap } from "./api";
import type { Contract } from "./types/contracts";

const SIERRA_SUFFIX = ".contract_class.json";
const CASM_SUFFIX = ".compiled_contract_class.json";

interface CollectedArtifacts {
	casm: string;
	sierra: string;
}

interface BuiltContracts {
	contracts: Contract[];
	/** One message per contract that could not be built, ready for the terminal. */
	problems: string[];
}

/**
 * Turns the files returned by a compilation into contracts.
 *
 * Scarb only writes the casm artifact when the `starknet-contract` target sets
 * `casm = true`, which a hand written Scarb.toml, and every package of a
 * workspace, often leaves at its default of false. A contract missing either
 * artifact is reported and skipped rather than failing the whole batch, so the
 * contracts that did compile still reach the deploy section.
 */
export function buildContractsFromCompileResult(
	compileResult: FileContentMap[]
): BuiltContracts {
	const contractToArtifacts: Record<string, CollectedArtifacts> = {};

	for (const file of compileResult) {
		const isCasm = file.file_name.endsWith(CASM_SUFFIX);
		const isSierra = file.file_name.endsWith(SIERRA_SUFFIX);
		if (!isCasm && !isSierra) continue;

		const name = file.file_name
			.replace(CASM_SUFFIX, "")
			.replace(SIERRA_SUFFIX, "")
			.replace("___testsingle_", "");

		const artifacts = contractToArtifacts[name] ?? { casm: "", sierra: "" };
		if (isCasm) {
			artifacts.casm = file.file_content;
		} else {
			artifacts.sierra = file.file_content;
		}
		contractToArtifacts[name] = artifacts;
	}

	const contracts: Contract[] = [];
	const problems: string[] = [];

	for (const [name, artifacts] of Object.entries(contractToArtifacts)) {
		const missing: string[] = [];
		if (artifacts.sierra === "") missing.push(`${SIERRA_SUFFIX} (sierra = true)`);
		if (artifacts.casm === "") missing.push(`${CASM_SUFFIX} (casm = true)`);

		if (missing.length > 0) {
			problems.push(
				`Skipping ${name}: the compilation did not produce ${missing.join(
					" or "
				)}. Set it under [[target.starknet-contract]] in Scarb.toml and compile again.`
			);
			continue;
		}

		try {
			const sierraContent = JSON.parse(artifacts.sierra);
			const casmContent = JSON.parse(artifacts.casm);

			contracts.push({
				name,
				abi: sierraContent.abi,
				sierra: artifacts.sierra,
				casm: casmContent,
				classHash: hash.computeContractClassHash(sierraContent),
				compiledClassHash: hash.computeCompiledClassHash(casmContent),
				sierraClassHash: hash.computeSierraContractClassHash(sierraContent),
				deployedInfo: [],
				declaredInfo: [],
				address: ""
			});
		} catch (error) {
			problems.push(
				`Skipping ${name}: could not read its compilation artifacts. ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	return { contracts, problems };
}

export async function saveContractArtifact(contract: Contract): Promise<void> {
	try {
		const response = await fetch("/api/save-artifact", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				name: contract.name,
				artifact: contract
			})
		});

		if (!response.ok) {
			throw new Error("Failed to save contract artifact");
		}
	} catch (error) {
		console.error("Error saving contract artifact:", error);
		throw error;
	}
}
