/* eslint-disable multiline-ternary */
import React, { useEffect } from "react";
import { apiUrl } from "../../utils/network";
import { artifactFilename, artifactFolder, getFileExtension, getFileNameFromPath } from "../../utils/utils";
import "./styles.css";
import { hash } from "starknet";
import Container from "../../components/ui_components/Container";
import storage from "../../utils/storage";
import { ethers } from "ethers";
import { type AccordianTabs } from "../Plugin";
import * as D from "../../components/ui_components/Dropdown";
import { BsChevronDown } from "react-icons/bs";
import {
	type CompilationRequest,
	type CompilationResult,
	type Contract,
	type ContractFile
} from "../../utils/types/contracts";
import { asyncFetch } from "../../utils/async_fetch";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

// Imported Atoms
import { cairoVersionAtom } from "../../atoms/cairoVersion";
import { compiledContractsAtom, selectedCompiledContract } from "../../atoms/compiledContracts";
import {
	activeTomlPathAtom,
	compilationAtom,
	currentFilenameAtom,
	hashDirAtom,
	isCompilingAtom,
	isValidCairoAtom,
	noFileSelectedAtom,
	statusAtom,
	tomlPathsAtom
} from "../../atoms/compilation";
import useRemixClient from "../../hooks/useRemixClient";
import { isEmpty } from "../../utils/misc";
import { useIcon } from "../../hooks/useIcons";

interface FileContentMap {
	file_name: string;
	file_content: string;
}

interface ScarbCompileResponse {
	status: string;
	message: string;
	file_content_map_array: FileContentMap[];
}

const CompilationCard: React.FC<{
	validation: boolean;
	isLoading: boolean;
	onClick: () => unknown;
	compileScarb: (workspacePath: string, scarbPath: string) => Promise<void>;
	currentWorkspacePath: string;
}> = ({
	validation,
	isLoading,
	onClick,
	compileScarb,
	currentWorkspacePath
}): React.ReactElement => {
	const { remixClient } = useRemixClient();

	const {
		activeTomlPath,
		tomlPaths,
		isCompiling,
		currentFilename
	} =
		useAtomValue(compilationAtom);

	const setActiveTomlPath = useSetAtom(activeTomlPathAtom);

	const isCurrentFileName = isEmpty(currentFilename);

	return (
		<Container>
			<div className={"compilation-info flex-col text-center align-items-center"}>
				<div className={"icon"}>
					<img src={useIcon("compile-icon.svg")} alt={"compile-icon"} />
				</div>
				<span>
					<p className={"text-no-break"}>
						Go into your file explorer and select a valid cairo file to compile
					</p>
				</span>
			</div>
			{activeTomlPath !== undefined && tomlPaths?.length > 0 && (
				<div className="project-dropdown-wrapper d-flex flex-column mb-3">
					<button
						className="btn btn-warning w-100 rounded-button text-break mb-1 mt-1 px-0"
						disabled={isCompiling}
						aria-disabled={isCompiling}
						onClick={() => {
							compileScarb(currentWorkspacePath, activeTomlPath)
								.then(() => {
									remixClient.emit("statusChanged", {
										key: "succeed",
										type: "success",
										title: "Cheers : compilation successful"
									});
								})
								.catch((e) => {
									console.log("error: ", e);
								});
						}}
					>
						Compile Project
					</button>

					<D.Root>
						<D.Trigger>
							<div className="btn btn-primary rounded-button w-100 trigger-wrapper px-0">
								<span className={"flex flex-row m-1"}>
									<label
										className="text-break text-white"
										style={{
											fontFamily: "inherit",
											fontSize: "inherit"
										}}
									>
										{activeTomlPath !== ""
											? activeTomlPath
											: currentWorkspacePath}
									</label>
									<BsChevronDown className={"ml-1"} />
								</span>
							</div>
						</D.Trigger>
						<D.Portal>
							<D.Content>
								{tomlPaths.map((tomlPath, i) => {
									return (
										<D.Item
											key={i.toString() + tomlPath}
											onClick={() => {
												setActiveTomlPath(tomlPath);
											}}
										>
											{tomlPath !== "" ? tomlPath : currentWorkspacePath}
										</D.Item>
									);
								})}
							</D.Content>
						</D.Portal>
					</D.Root>
					<div className="text-on-bg mx-auto">Or compile a single file:</div>
				</div>
			)}
			<button
				className="compile-button btn btn-information btn-block d-block w-100 text-break rounded-button remixui_disabled mb-1 mt-1 px-0"
				style={{
					cursor: `${!validation || isCurrentFileName ? "not-allowed" : "pointer"}`
				}}
				disabled={!validation || isCurrentFileName || isCompiling}
				aria-disabled={!validation || isCurrentFileName || isCompiling}
				onClick={onClick}
			>
				<div className="d-flex align-items-center justify-content-center">
					<div className="text-truncate overflow-hidden text-nowrap">
						{!validation ? (
							<span>Select a valid cairo file</span>
						) : (
							<>
								<div className="d-flex align-items-center justify-content-center">
									{isLoading ? (
										<>
											<span
												style={{
													paddingLeft: "0.5rem"
												}}
											>
												{useAtomValue(statusAtom)}
											</span>
										</>
									) : (
										<div className="text-truncate overflow-hidden text-nowrap">
											<span>Compile</span>
											<span className="ml-1 text-nowrap">
												{currentFilename}
											</span>
										</div>
									)}
								</div>
							</>
						)}
					</div>
				</div>
			</button>
		</Container>
	);
};

interface CompilationProps {
	setAccordian: React.Dispatch<React.SetStateAction<AccordianTabs>>;
}

const Compilation: React.FC<CompilationProps> = ({ setAccordian }) => {
	const { remixClient } = useRemixClient();
	const cairoVersion = useAtomValue(cairoVersionAtom);

	const [contracts, setContracts] = useAtom(compiledContractsAtom);
	const [selectedContract, setSelectedContract] = useAtom(selectedCompiledContract);

	const {
		currentFilename,
		isCompiling,
		isValidCairo,
		noFileSelected,
		hashDir,
		tomlPaths,
		activeTomlPath
	} = useAtomValue(compilationAtom);

	const setStatus = useSetAtom(statusAtom);
	const setHashDir = useSetAtom(hashDirAtom);
	const setNoFileSelected = useSetAtom(noFileSelectedAtom);
	const setIsValidCairo = useSetAtom(isValidCairoAtom);
	const setIsCompiling = useSetAtom(isCompilingAtom);
	const setCurrentFilename = useSetAtom(currentFilenameAtom);
	const setTomlPaths = useSetAtom(tomlPathsAtom);
	const setActiveTomlPath = useSetAtom(activeTomlPathAtom);

	const [currWorkspacePath, setCurrWorkspacePath] = React.useState<string>("");

	useEffect(() => {
		// read hashDir from localStorage
		const hashDir = storage.get("hashDir");
		if (hashDir != null) {
			setHashDir(hashDir);
		} else {
			// create a random hash of length 32
			const hashDir = ethers.utils
				.hashMessage(ethers.utils.randomBytes(32))
				.replace("0x", "");
			setHashDir(hashDir);
			storage.set("hashDir", hashDir);
		}
	}, [hashDir]);

	useEffect(() => {
		remixClient.on("fileManager", "noFileSelected", () => {
			setNoFileSelected(true);
		});
	}, [remixClient]);

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		setTimeout(async () => {
			try {
				if (noFileSelected) {
					throw new Error("No file selected");
				}

				// get current file
				const currentFile = await remixClient.call("fileManager", "getCurrentFile");
				if (currentFile.length > 0) {
					const filename = getFileNameFromPath(currentFile);
					const currentFileExtension = getFileExtension(filename);
					setIsValidCairo(currentFileExtension === "cairo");
					setCurrentFilename(filename);

					remixClient.emit("statusChanged", {
						key: "succeed",
						type: "info",
						title: "Current file: " + currentFilename
					});
				}
			} catch (e) {
				remixClient.emit("statusChanged", {
					key: "failed",
					type: "info",
					title: "Please open a cairo file to compile"
				});
				console.log("error: ", e);
			}
		}, 500);
	}, [remixClient, currentFilename, noFileSelected]);

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		setTimeout(async () => {
			remixClient.on("fileManager", "currentFileChanged", (currentFileChanged: any) => {
				const filename = getFileNameFromPath(currentFileChanged);
				const currentFileExtension = getFileExtension(filename);
				setIsValidCairo(currentFileExtension === "cairo");
				setCurrentFilename(filename);
				remixClient.emit("statusChanged", {
					key: "succeed",
					type: "info",
					title: "Current file: " + currentFilename
				});
				setNoFileSelected(false);
			});
		}, 500);
	}, [remixClient, currentFilename]);

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		setTimeout(async () => {
			try {
				if (noFileSelected) {
					throw new Error("No file selected");
				}
				const currentFilePath = await remixClient.call("fileManager", "getCurrentFile");
				if (!currentFilePath.endsWith(".cairo")) {
					throw new Error("Not a valid cairo file");
				}
				const currentFileContent = await remixClient.call(
					"fileManager",
					"readFile",
					currentFilePath
				);
				await fetch(`${apiUrl}/save_code/${hashDir}/${currentFilePath}`, {
					method: "POST",
					body: currentFileContent,
					redirect: "follow",
					headers: {
						"Content-Type": "application/octet-stream"
					}
				});
			} catch (e) {
				remixClient.emit("statusChanged", {
					key: "failed",
					type: "info",
					title: "Please open a cairo file to compile"
				});
				console.log("error: ", e);
			}
		}, 100);
	}, [currentFilename, remixClient]);

	async function getTomlPaths (workspacePath: string, currPath: string): Promise<string[]> {
		const resTomlPaths: string[] = [];
		try {
			const allFiles = await remixClient.fileManager.readdir(workspacePath + "/" + currPath);
			// get keys of allFiles object
			const allFilesKeys: string[] = Object.keys(allFiles);
			// const get all values of allFiles object
			const allFilesValues = Object.values(allFiles);

			for (let i = 0; i < allFilesKeys.length; i++) {
				if (allFilesKeys[i].endsWith("Scarb.toml")) {
					resTomlPaths.push(currPath);
				}

				if (Object.values(allFilesValues[i])[0] as unknown as boolean) {
					const recTomlPaths = await getTomlPaths(workspacePath, allFilesKeys[i]);
					resTomlPaths.push(...recTomlPaths);
				}
			}
		} catch (e) {
			console.log("error: ", e);
		}
		return resTomlPaths;
	}

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		setTimeout(async () => {
			// get current workspace path
			try {
				const currWorkspace = await remixClient.filePanel.getCurrentWorkspace();
				setCurrWorkspacePath(currWorkspace.absolutePath);
			} catch (e) {
				console.log("error: ", e);
			}
		});
	});

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		setTimeout(async () => {
			// get current workspace path
			try {
				if (currWorkspacePath === "") return;
				const allTomlPaths = await getTomlPaths(currWorkspacePath, "");
				setTomlPaths(allTomlPaths);
				if (activeTomlPath === "" || activeTomlPath === undefined) {
					setActiveTomlPath(allTomlPaths[0]);
				}
			} catch (e) {
				console.log("error: ", e);
			}
		}, 1);
	}, [currWorkspacePath]);

	useEffect(() => {
		if (activeTomlPath === "" || activeTomlPath === undefined) {
			setActiveTomlPath(tomlPaths[0]);
		}
	}, [tomlPaths]);

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		setTimeout(async () => {
			remixClient.on("fileManager", "fileSaved", (_: any) => {
				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				setTimeout(async () => {
					// get current workspace path
					try {
						if (currWorkspacePath !== "") {
							const allTomlPaths = await getTomlPaths(currWorkspacePath, "");
							setTomlPaths(allTomlPaths);
						}
					} catch (e) {
						console.log("error: ", e);
					}
				}, 100);
			});

			remixClient.on("fileManager", "fileAdded", (_: any) => {
				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				setTimeout(async () => {
					// get current workspace path
					try {
						if (currWorkspacePath !== "") {
							const allTomlPaths = await getTomlPaths(currWorkspacePath, "");

							setTomlPaths(allTomlPaths);
						}
					} catch (e) {
						console.log("error: ", e);
					}
				}, 100);
			});
			remixClient.on("fileManager", "folderAdded", (_: any) => {
				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				setTimeout(async () => {
					// get current workspace path
					try {
						if (currWorkspacePath !== "") {
							const allTomlPaths = await getTomlPaths(currWorkspacePath, "");

							setTomlPaths(allTomlPaths);
						}
					} catch (e) {
						console.log("error: ", e);
					}
				}, 100);
			});
			remixClient.on("fileManager", "fileRemoved", (_: any) => {
				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				setTimeout(async () => {
					// get current workspace path
					try {
						if (currWorkspacePath !== "") {
							const allTomlPaths = await getTomlPaths(currWorkspacePath, "");

							setTomlPaths(allTomlPaths);
						}
					} catch (e) {
						console.log("error: ", e);
					}
				}, 100);
			});
			remixClient.on("filePanel", "workspaceCreated", (_: any) => {
				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				setTimeout(async () => {
					// get current workspace path
					try {
						if (currWorkspacePath !== "") {
							const allTomlPaths = await getTomlPaths(currWorkspacePath, "");

							setTomlPaths(allTomlPaths);
						}
					} catch (e) {
						console.log("error: ", e);
					}
				}, 100);
			});
			remixClient.on("filePanel", "workspaceRenamed", (_: any) => {
				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				setTimeout(async () => {
					// get current workspace path
					try {
						if (currWorkspacePath !== "") {
							const allTomlPaths = await getTomlPaths(currWorkspacePath, "");

							setTomlPaths(allTomlPaths);
						}
					} catch (e) {
						console.log("error: ", e);
					}
				}, 100);
			});
		}, 500);
	}, [remixClient]);

	const compilations = [
		{
			validation: isValidCairo,
			isLoading: isCompiling,
			onClick: compile
		}
	];

	const getAllContractFiles = async (
		workspacePath: string,
		dirPath = ""
	): Promise<ContractFile[]> => {
		const files = [] as ContractFile[];
		const pathFiles = await remixClient.fileManager.readdir(`${workspacePath}/${dirPath}`);
		for (const [path, entry] of Object.entries<any>(pathFiles)) {
			if (entry.isDirectory) {
				const deps = await getAllContractFiles(workspacePath, path);
				for (const dep of deps) files.push(dep);
				continue;
			}

			const content = await remixClient.fileManager.readFile(path);

			if (!path.endsWith(".sol")) continue;

			files.push({
				file_name: path,
				real_path: path,
				file_content: content
			});
		}
		return files;
	};

	async function compile (compilationRequest: CompilationRequest): Promise<void> {
		try {
			const result = await asyncFetch("/compile-async", "compile-result", compilationRequest);

			const resultJson = JSON.parse(result) as CompilationResult;

			if (resultJson.status !== "Success") {
				throw new Error("Solidity Compilation Request Failed");
			} else {
				await remixClient.call(
					"notification" as any,
					"toast",
					"Solidity compilation request successful"
				);
			}

			await writeResultsToArtifacts(resultJson);
		} catch {
			console.log("Error compiling");
		}
	}

	const writeResultsToArtifacts = async (compileResult: CompilationResult): Promise<void> => {
		const contractToArtifacts: Record<
			string,
			{
				casm: string;
				sierra: string;
			}
		> = {};
		for (const file of compileResult.artifacts) {
			if (file.real_path.endsWith(".sierra.json")) {
				contractToArtifacts[file.real_path.replace(".sierra.json", "")].sierra =
					file.file_content;
			} else if (file.real_path.endsWith(".casm.json")) {
				contractToArtifacts[file.real_path.replace(".casm.json", "")].casm =
					file.file_content;
			}
		}

		console.log(contractToArtifacts);

		const artifacts: string[] = [];
		for (const file of compileResult.artifacts) {
			const artifactsPath = `${artifactFolder(currWorkspacePath)}/${file.real_path}`;
			artifacts.push(artifactsPath);
			try {
				await remixClient.call(
					"fileManager",
					"writeFile",
					artifactsPath,
					file.file_content
				);
			} catch (e) {
				if (e instanceof Error) {
					await remixClient.call(
						"notification" as any,
						"toast",
						e.message + " try deleting the files: " + artifactsPath
					);
				}
				remixClient.emit("statusChanged", {
					key: "succeed",
					type: "warning",
					title: "Failed to save artifacts"
				});
			} finally {
				remixClient.emit("statusChanged", {
					key: "succeed",
					type: "info",
					title: "Saved artifacts"
				});
			}
		}
	};

	async function generateSingleFileCompilationRequest (): Promise<CompilationRequest> {
		const currentFilePath = await remixClient.call("fileManager", "getCurrentFile");
		const currentFileContent = await remixClient.call(
			"fileManager",
			"readFile",
			currentFilePath
		);
		return {
			files: [
				{
					file_name: "src/lib.rs",
					real_path: currentFilePath,
					file_content: currentFileContent
				}
			]
		};
	}

	async function compileSingle (): Promise<void> {
		setIsCompiling(true);
		setStatus("Compiling...");
		// clear current file annotations: inline syntax error reporting
		await remixClient.editor.clearAnnotations();
		try {
			setStatus("Getting cairo file path...");
			const currentFilePath = await remixClient.call("fileManager", "getCurrentFile");

			setStatus("Getting cairo file content...");

			setStatus("Parsing cairo code...");

			// request
			const compilationRequest = await generateSingleFileCompilationRequest();

			await compile(compilationRequest);

			if (contract != null) {
				setSelectedContract(contract);
				const contractName = contract.name;
				const contractPath = contract.path;
				contracts.filter(
					(contract) => contract.name !== contractName && contract.path !== contractPath
				);
				setContracts([contract, ...contracts]);
			} else {
				if (selectedContract == null) setSelectedContract(contracts[0]);
			}

			setStatus("Saving artifacts...");

			const sierraPath = `${artifactFolder(currentFilePath)}/${artifactFilename(
				".json",
				currentFilename
			)}`;
			const casmPath = `${artifactFolder(currentFilePath)}/${artifactFilename(
				".casm",
				currentFilename
			)}`;

			remixClient.emit("statusChanged", {
				key: "succeed",
				type: "success",
				title: `Cheers : compilation successful, classHash: ${hash.computeContractClassHash(
					sierra.file_content
				)}`
			});

			try {
				await remixClient.call("fileManager", "writeFile", sierraPath, sierra.file_content);
				await remixClient.call("fileManager", "writeFile", casmPath, casm.file_content);
			} catch (e) {
				if (e instanceof Error) {
					await remixClient.call(
						"notification" as any,
						"toast",
						e.message + " try deleting the files: " + sierraPath + " and " + casmPath
					);
				}
				remixClient.emit("statusChanged", {
					key: "succeed",
					type: "warning",
					title: "Failed to save artifacts"
				});
			}

			setStatus("Opening artifacts...");

			// await remixClient.fileManager.open(sierraPath)

			await remixClient.call(
				"notification" as any,
				"toast",
				`Cairo compilation output written to: ${sierraPath} `
			);
			setStatus("done");
			setAccordian("deploy");
		} catch (e) {
			setStatus("failed");
			if (e instanceof Error) {
				await remixClient.call("notification" as any, "alert", {
					id: "starknetRemixPluginAlert",
					title: "Cairo Compilation Failed",
					message: e.message
				});
			}
			console.error(e);
		}
		setIsCompiling(false);
	}

	async function compileScarb (workspacePath: string, scarbPath: string): Promise<void> {
		setIsCompiling(true);
		try {
			setStatus("Saving scarb workspace...");

			let result: string;
			try {
				result = await asyncFetch(
					`compile-scarb-async/${hashDir}/${workspacePath.replace(".", "")}/${scarbPath}`,
					"compile-scarb-result"
				);
			} catch (e) {
				await remixClient.call(
					"notification" as any,
					"toast",
					"Could not reach cairo compilation server"
				);
				throw new Error("Cairo Compilation Request Failed");
			}
			const scarbCompile: ScarbCompileResponse = JSON.parse(result);
			if (scarbCompile.status !== "Success") {
				await remixClient.call("notification" as any, "alert", {
					id: "starknetRemixPluginAlert",
					title: "Scarb compilation failed!",
					message: "Scarb compilation failed!, you can read logs in the terminal console"
				});
				remixClient.emit("statusChanged", {
					key: "failed",
					type: "error",
					title: "Scarb compilation failed!"
				});
				await remixClient.terminal.log({
					type: "error",
					value: scarbCompile.message
				});
				throw new Error("Cairo Compilation Request Failed");
			}

			remixClient.emit("statusChanged", {
				key: "succeed",
				type: "success",
				title: "Scarb compilation successful"
			});

			setStatus("Analyzing contracts...");

			let notifyCasmInclusion = false;

			const contractsToStore: Contract[] = [];

			for (const file of scarbCompile.file_content_map_array) {
				if (file.file_name?.endsWith(".contract_class.json")) {
					const contractName: string = file.file_name.replace(".contract_class.json", "");
					const sierra = JSON.parse(file.file_content);
					if (
						scarbCompile.file_content_map_array?.find(
							(file: { file_name: string }) =>
								file.file_name === contractName + ".compiled_contract_class.json"
						) == null
					) {
						notifyCasmInclusion = true;
						continue;
					}
					const casm = JSON.parse(
						scarbCompile.file_content_map_array.find(
							(file: { file_name: string }) =>
								file.file_name === contractName + ".compiled_contract_class.json"
						)?.file_content ?? ""
					);
					const genContract = await genContractData(
						contractName,
						file.file_name,
						JSON.stringify(sierra),
						JSON.stringify(casm)
					);
					if (genContract != null) contractsToStore.push(genContract);
				}
			}

			if (contractsToStore.length >= 1) {
				setSelectedContract(contractsToStore[0]);
				setContracts([...contractsToStore, ...contracts]);
			} else {
				if (selectedContract == null) setSelectedContract(contracts[0]);
			}
			if (notifyCasmInclusion) {
				await remixClient.call(
					"notification" as any,
					"toast",
					"Please include 'casm=true' in the Scarb.toml to deploy cairo contracts"
				);
			}

			setStatus("Saving compilation output files...");
			try {
				for (const file of scarbCompile.file_content_map_array) {
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					const filePath = `${scarbPath}/target/dev/${file.file_name}`;
					await remixClient.call(
						"fileManager",
						"writeFile",
						filePath,
						JSON.stringify(JSON.parse(file.file_content))
					);
				}
				await remixClient.call(
					"notification" as any,
					"toast",
					`Compilation resultant files are written to ${scarbPath}/target/dev directory`
				);
			} catch (e) {
				if (e instanceof Error) {
					await remixClient.call(
						"notification" as any,
						"toast",
						e.message + " try deleting the dir: " + scarbPath + "target/dev"
					);
				}
				remixClient.emit("statusChanged", {
					key: "succeed",
					type: "warning",
					title: "Failed to save artifacts"
				});
			}
			setStatus("done");
			setAccordian("deploy");
		} catch (e) {
			setStatus("failed");
			console.log("error: ", e);
		}
		setIsCompiling(false);
	}

	async function genContractData (
		contractName: string,
		path: string,
		sierraFile: string,
		casmFile: string
	): Promise<Contract | null> {
		const sierra = await JSON.parse(sierraFile);
		const casm = await JSON.parse(casmFile);
		const compiledClassHash = hash.computeCompiledClassHash(casm);
		const classHash = hash.computeContractClassHash(sierraFile);
		const sierraClassHash = hash.computeSierraContractClassHash(sierra);
		if (
			contracts.find(
				(contract) =>
					contract.classHash === classHash &&
					contract.compiledClassHash === compiledClassHash
			) != null
		) {
			return null;
		}
		const contract = {
			name: contractName,
			abi: sierra.abi,
			compiledClassHash,
			classHash,
			sierraClassHash,
			sierra: sierraFile,
			casm,
			path,
			deployedInfo: [],
			address: "",
			declaredInfo: []
		};

		return contract;
	}

	return (
		<div>
			{compilations.map((compilation, idx) => {
				return (
					<CompilationCard
						key={`${JSON.stringify(compilation)}${idx}`}
						validation={compilation.validation}
						isLoading={compilation.isLoading}
						onClick={compilation.onClick}
						compileScarb={compileScarb}
						currentWorkspacePath={currWorkspacePath}
					/>
				);
			})}
		</div>
	);
};

export default Compilation;
