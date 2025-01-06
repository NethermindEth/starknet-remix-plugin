import type {
	VoyagerVerifyRequest,
	VoyagerVerifyResponse,
	VoyagerJobStatusResponse,
	VoyagerLicense
} from "./types/voyager";

export type VoyagerNetwork = "mainnet" | "sepolia";

export class VoyagerAPI {
	private getBaseUrl(network: VoyagerNetwork): string {
		return network === "mainnet"
			? "https://api.voyager.online/beta"
			: "https://sepolia-api.voyager.online/beta";
	}

	async verifyContract(request: VoyagerVerifyRequest, network: VoyagerNetwork, classHash: string): Promise<VoyagerVerifyResponse> {
		console.log(request);

		const response = await fetch(`${this.getBaseUrl(network)}/class-verify/${classHash}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(request)
		});

		if (!response.ok) {
			throw new Error(`Verification request failed: ${response.statusText}`);
		}

		return await response.json();
	}

	async getVerificationStatus(jobId: string, network: VoyagerNetwork): Promise<VoyagerJobStatusResponse> {
		const response = await fetch(`${this.getBaseUrl(network)}/class-verify/job/${jobId}`);

		if (!response.ok) {
			throw new Error(`Failed to get verification status: ${response.statusText}`);
		}

		return await response.json();
	}

	createScarbToml(contractName: string, starknetVersion: string): string {
		return `[package]
name = "${contractName.toLowerCase()}"
version = "0.1.0"

[dependencies]
starknet = "${starknetVersion}"

[tool.voyager]
contract = { path = "src/lib.cairo" }`;
	}

	prepareVerificationRequest(
		contractName: string,
		contractContent: string,
		compilerVersion: string,
		scarbVersion: string,
		license: VoyagerLicense,
		isAccountContract: boolean
	): VoyagerVerifyRequest {
		const scarbToml = this.createScarbToml(contractName, compilerVersion);

		return {
			compiler_version: compilerVersion,
			license,
			contract_file: "src/lib.cairo",
			scarb_version: scarbVersion,
			name: contractName,
			account_contract: isAccountContract,
			project_dir_path: ".",
			files: {
				"Scarb.toml": scarbToml,
				"src/lib.cairo": contractContent
			}
		};
	}
}
