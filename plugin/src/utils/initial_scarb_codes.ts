import axios from "axios";

export interface RemixFileInfo {
	fileName: string;
	content: string;
	path: string;
}

export async function fetchGitHubFilesRecursively(
	repository: string,
	path: string,
	ref?: string
): Promise<RemixFileInfo[]> {
	const apiUrl = (function () {
		if (ref === undefined) {
			return `https://api.github.com/repos/${repository}/contents/${path}`;
		}

		return `https://api.github.com/repos/${repository}/contents/${path}?ref=${ref}`;
	})();

	try {
		const response = await axios.get(apiUrl);
		if (!Array.isArray(response.data)) {
			throw new Error("Failed to fetch directory.");
		}

		const files = response.data.filter((item) => item.type === "file");
		const fileContents = await Promise.all(
			files.map(async (file): Promise<RemixFileInfo> => {
				const fileResponse = await axios.get(file.download_url);
				return {
					path,
					fileName: file.name,
					content: fileResponse.data
				};
			})
		);

		const subDirectories = response.data.filter((item) => item.type === "dir");
		const subDirectoryContents = await Promise.all(
			subDirectories.map(async (dir) => {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				const subPath = `${path}/${dir.name}`;
				return await fetchGitHubFilesRecursively(repository, subPath, ref);
			})
		);

		return fileContents.filter((content) => content !== null).concat(...subDirectoryContents);
	} catch (error) {
		throw new Error("Error fetching directory");
	}
}
