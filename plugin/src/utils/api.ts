import { useMemo } from "react";

export interface ApiResponse<T> {
	success: boolean;
	status: string;
	code: number;
	message: string;
	data: T | null;
	error: string | null;
	timestamp: string;
	request_id: string;
}

export interface FileContentMap {
	file_name: string;
	file_content: string;
}

export interface BaseRequest {
	files: FileContentMap[];
}

export interface CompilationRequest extends BaseRequest {
	version: string | null;
}

export type TestEngine = "scarb" | "forge";

export interface TestRequest extends BaseRequest {
	test_engine: TestEngine;
}

export interface CompilationResponse extends ApiResponse<FileContentMap[]> {
}

export interface TestResponse extends ApiResponse<void> {
}

export interface VersionResponse extends ApiResponse<string> {
}

export interface AllowedVersionsResponse extends ApiResponse<string[]> {
}

export class Api {
	private readonly apiUrl: string;

	constructor (apiUrl: string) {
		this.apiUrl = apiUrl;
	}

	private async asyncFetch<T> (
		method: string,
		getterMethod: string,
		body?: BaseRequest | CompilationRequest | TestRequest
	): Promise<T> {
		const response = await fetch(`${this.apiUrl}/${method}`, {
			method: "POST",
			redirect: "follow",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		});

		const responseJson = (await response.json()) as ApiResponse<string>;

		if (responseJson.data === null) {
			throw new Error(`Error while running method ${method}, error: ${responseJson.error ?? "Unknown error"}`);
		}

		const pid = responseJson.data;

		try {
			await this.waitProcess(pid);

			const response = await fetch(`${this.apiUrl}/${getterMethod}/${pid}`, {
				method: "GET",
				redirect: "follow",
				headers: {
					"Content-Type": "application/json"
				}
			});

			return await response.json() as T;
		} catch (e) {
			throw new Error(`Error while running process with id ${pid}, error: ${e as string}`);
		}
	}

	private async waitProcess (pid: string): Promise<string> {
		const response: ApiResponse<string> = await this.rawGetRequest(`process_status/${pid}`);

		if (response.data === "Completed") {
			return response.data;
		}

		if (response.data === "Error") {
			throw new Error(
				`Error while running process with id ${pid}, error: ${response.error ?? "Unknown error"}`
			);
		}

		if (response.data === "Running" || response.data === "New") {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return await this.waitProcess(pid);
		}

		throw new Error(`Unknown process status: ${pid}`);
	}

	private async rawGetRequest<T> (method: string): Promise<T> {
		const response = await fetch(`${this.apiUrl}/${method}`, {
			method: "GET",
			redirect: "follow",
			headers: {
				"Content-Type": "application/json"
			}
		});

		return await response.json();
	}

	public async compile (request: CompilationRequest): Promise<CompilationResponse> {
		return await this.asyncFetch("compile-async", "compile-async", request);
	}

	public async test (request: TestRequest): Promise<TestResponse> {
		return await this.asyncFetch("test-async", "test-async", request);
	}

	public async version (): Promise<VersionResponse> {
		return await this.asyncFetch("scarb-version-async", "scarb-version-async");
	}

	public async allowedVersions (): Promise<AllowedVersionsResponse> {
		return await this.rawGetRequest("allowed-versions");
	}
}

export const useApi = (apiUrl: string): Api => {
	return useMemo(() => new Api(apiUrl), [apiUrl]);
};
