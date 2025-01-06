import { type Abi, type AbiElement } from "./types/contracts";
import { type Network, networkExplorerUrls } from "./constants";
import type { FileContentMap } from "./api";
import { type RemixClientType } from "../hooks/useRemixClient";

function isValidCairo (filename: string): boolean {
	return filename?.endsWith(".cairo") ?? false;
}

const getFileNameFromPath = (path: string): string => path.split("/").pop() ?? "";

const getContractNameFromFullName = (fullName: string): string => fullName.split(".")[0];

const artifactFolder = (path: string): string => {
	if (path.includes("artifacts")) {
		return path.split("/").slice(0, -1).join("/");
	}
	return path.split("/").slice(0, -1).join("/").concat("/artifacts");
};

const getShortenedHash = (address: string, first: number, second: number): string => {
	return `${address.slice(0, first)}...${address.slice(-1 * second)}`;
};

const getConstructor = (abi: Abi): AbiElement | undefined => {
	return abi.find((item) => item.name === "constructor");
};

const getRoundedNumber = (number: number, decimals: number): number => {
	return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const weiToEth = (wei: number): number => {
	return wei / 10 ** 18;
};

const getExplorerUrl = (explorer: keyof typeof networkExplorerUrls, chain: Network): string =>
	networkExplorerUrls[explorer][chain];

const trimStr = (str?: string, strip?: number): string => {
	if (str === undefined || str === null) {
		return "";
	}
	const lStrip = strip ?? 6;
	const length = str.length;
	return `${str?.slice(0, lStrip)}...${str?.slice(length - lStrip)}`;
};

const getFolderFilemapRecursive = async (
	workspacePath: string,
	remixClient: RemixClientType,
	dirPath = ""
): Promise<FileContentMap[]> => {
	const files = [] as FileContentMap[];
	const pathFiles = await remixClient.fileManager.readdir(`${workspacePath}/${dirPath}`);
	for (const [path, entry] of Object.entries<any>(pathFiles)) {
		if (entry.isDirectory === true) {
			const deps = await getFolderFilemapRecursive(workspacePath, remixClient, path);
			for (const dep of deps) files.push(dep);
			continue;
		}

		const content = await remixClient.fileManager.readFile(path);

		if (!path.endsWith(".cairo") && !path.endsWith("Scarb.toml")) continue;

		files.push({
			file_name: path,
			file_content: content
		});
	}
	return files;
};

export {
	isValidCairo,
	getFileNameFromPath,
	getContractNameFromFullName,
	artifactFolder,
	getShortenedHash,
	getConstructor,
	getRoundedNumber,
	weiToEth,
	getExplorerUrl,
	trimStr,
	getFolderFilemapRecursive
};
