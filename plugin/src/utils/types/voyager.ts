export type VoyagerLicense =
	| "No License (None)"
	| "The Unlicense (Unlicense)"
	| "MIT License (MIT)"
	| "GNU General Public License v2.0 (GNU GPLv2)"
	| "GNU General Public License v3.0 (GNU GPLv3)"
	| "GNU Lesser General Public License v2.1 (GNU LGPLv2.1)"
	| "GNU Lesser General Public License v3.0 (GNU LGPLv3)"
	| "BSD 2-clause \"Simplified\" license (BSD-2-Clause)"
	| "BSD 3-clause \"New\" Or \"Revisited license (BSD-3-Clause)"
	| "Mozilla Public License 2.0 (MPL-2.0)"
	| "Open Software License 3.0 (OSL-3.0)"
	| "Apache 2.0 (Apache-2.0)"
	| "GNU Affero General Public License (GNU AGPLv3)"
	| "Business Source License (BSL 1.1)";

export interface VoyagerVerifyRequest {
	compiler_version: string;
	license: VoyagerLicense;
	contract_file: string;
	scarb_version: string;
	name: string;
	account_contract: boolean;
	project_dir_path: string;
	files: Record<string, string>;
}

export interface VoyagerVerifyResponse {
	job_id: string;
}

export enum VoyagerVerificationStatus {
	SUBMITTED = 0,
	COMPILED = 1,
	COMPILE_FAILED = 2,
	FAIL = 3,
	SUCCESS = 4,
}

export interface VoyagerJobStatusResponse {
	status: VoyagerVerificationStatus;
	job_id: string;
	class_hash: string;
	created_timestamp: number;
	updated_timestamp: number;
	status_description: string;
	message?: string;
	address: string;
	contract_file: string;
	name: string;
	version: string;
	license: VoyagerLicense;
}
