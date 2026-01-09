import { useState, useEffect, useMemo } from "react";
import { PluginClient } from "@remixproject/plugin";
import { createClient } from "@remixproject/plugin-webview";
import { fetchGitHubFilesRecursively } from "../utils/initial_scarb_codes";
import axios from "axios";

class RemixClient extends PluginClient {
	constructor() {
		super();
		this.methods = ["loadFolderFromUrl", "loadFolderFromGithub"];
	}

	async loadFolderFromUrl(url: string): Promise<void> {
		try {
			await this.call("filePanel", "createWorkspace", "code-sample", false);
			// Fetch JSON data from the URL
			const response = await axios.get(url);
			const folderContent = response.data;

			// Iterate over each file in the folderContent
			for (const [filePath, fileContent] of Object.entries(folderContent)) {
				await this.call("fileManager", "setFile", filePath, fileContent as string);
			}

			console.log("Folder loaded successfully.");
		} catch (error) {
			console.error("Error loading folder:", error);
		}
	}

	async loadFolderFromGithub(url: string, folderPath: string): Promise<void> {
		console.log("loadFolderFromGithub", url, folderPath);
		try {
			await this.call("filePanel", "createWorkspace", "code-sample", false);
			const folder = await fetchGitHubFilesRecursively(url, folderPath);
			console.log("folder", folder);
			for (const file of folder) {
				if (file !== null) {
					let fileContent = file.content;
					if (file.fileName === "Scarb.toml") {
						fileContent = fileContent.concat("\ncasm = true\n");
					}
					await this.call(
						"fileManager",
						"setFile",
						`${file.path}/${file.fileName}`,
						fileContent
					);
				}
			}
			// write Scarb.toml at root level
			try {
				const endpoint = `https://raw.githubusercontent.com/${url}/main/Scarb.toml`;
				const response = await axios.get(endpoint);
				const fileContent = response.data.concat("\ncasm = true\n");
				await this.call("fileManager", "setFile", "Scarb.toml", fileContent);
			} catch (error) {
				console.error("Error writing Scarb.toml:", error);
			}
		} catch (error) {
			console.error("Error loading folder from GitHub:", error);
		}
	}
}

// Create the client instance outside the hook to ensure it's a singleton
const remixClientInstance = createClient(new RemixClient());

/**
 * React hook for interacting with the Remix client
 * @returns Hook state and methods for interacting with Remix
 */
const useRemixClient = () => {
	// Track connection state
	const [isConnected, setIsConnected] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	// Initialize the client on mount
	useEffect(() => {
		const initializeClient = async () => {
			try {
				setIsLoading(true);
				await remixClientInstance.onload();
				setIsConnected(true);
				setError(null);
			} catch (err) {
				setError(err instanceof Error ? err : new Error(String(err)));
				console.error("Failed to initialize Remix client:", err);
			} finally {
				setIsLoading(false);
			}
		};

		initializeClient();

		remixClientInstance.onload(() => {
			setIsConnected(true);
		});

		// Cleanup function
		return () => {};
	}, []);

	// Wrap client methods to handle errors consistently
	const loadFolderFromUrl = async (url: string) => {
		try {
			return await remixClientInstance.loadFolderFromUrl(url);
		} catch (err) {
			setError(err instanceof Error ? err : new Error(String(err)));
			throw err;
		}
	};

	const loadFolderFromGithub = async (url: string, folderPath: string) => {
		try {
			return await remixClientInstance.loadFolderFromGithub(url, folderPath);
		} catch (err) {
			setError(err instanceof Error ? err : new Error(String(err)));
			throw err;
		}
	};

	// Reset error state
	const clearError = () => setError(null);

	// Memoize the return value to prevent unnecessary re-renders
	const hookValue = useMemo(() => ({
		remixClient: remixClientInstance,
		isConnected,
		isLoading,
		error,
		clearError,
		loadFolderFromUrl,
		loadFolderFromGithub
	}), [isConnected, isLoading, error]);

	return hookValue;
};

export default useRemixClient;