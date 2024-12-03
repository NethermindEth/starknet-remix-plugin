import { type RemixClient } from "@remixproject/plugin-api";
import { asyncFetch } from "../../../utils/async_fetch";
import { apiUrl } from "../../../utils/network";
import { type CompilationResult, type File, type CompilationError } from "../types";

export class CompilationError extends Error {
	constructor(
		message: string,
		public readonly type: "syntax" | "runtime" | "network",
		public readonly details?: unknown
	) {
		super(message);
		this.name = "CompilationError";
	}
}

export interface CompilationService {
	compileSingleFile(file: File): Promise<CompilationResult>;
	compileProject(scarbPath: string, workspacePath: string): Promise<CompilationResult>;
}

export class CairoCompilationService implements CompilationService {
	constructor(
		private readonly remixClient: RemixClient,
		private readonly hashDir: string
	) {}

	async compileSingleFile(file: File): Promise<CompilationResult> {
		try {
			// Save file to backend
			await this.saveFileToBackend(file);

			// Create compilation request
			const request = {
				files: [
					{
						file_name: "src/lib.rs",
						real_path: file.path,
						file_content: file.content
					}
				]
			};

			// Compile
			const result = await asyncFetch("/compile-async", "compile-result", request);
			return JSON.parse(result) as CompilationResult;
		} catch (error) {
			throw new CompilationError(
				"Failed to compile file",
				"runtime",
				error instanceof Error ? error.message : error
			);
		}
	}

	async compileProject(scarbPath: string, workspacePath: string): Promise<CompilationResult> {
		try {
			const result = await asyncFetch(
				`compile-scarb-async/${this.hashDir}/${workspacePath.replace(".", "")}/${scarbPath}`,
				"compile-scarb-result"
			);

			const compilationResult = JSON.parse(result) as CompilationResult;
			if (compilationResult.status !== "Success") {
				throw new Error(compilationResult.message ?? "Unknown compilation error");
			}

			return compilationResult;
		} catch (error) {
			throw new CompilationError(
				"Failed to compile project",
				"runtime",
				error instanceof Error ? error.message : error
			);
		}
	}

	private async saveFileToBackend(file: File): Promise<void> {
		try {
			await fetch(`${apiUrl}/save_code/${this.hashDir}/${file.path}`, {
				method: "POST",
				body: file.content,
				headers: {
					"Content-Type": "application/octet-stream"
				}
			});
		} catch (error) {
			throw new CompilationError(
				"Failed to save file to backend",
				"network",
				error instanceof Error ? error.message : error
			);
		}
	}
} 