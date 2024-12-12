/* eslint-disable multiline-ternary */
import React, { useEffect } from "react";
import { artifactFolder, getFileNameFromPath, isValidCairo } from "../../utils/utils";
import "./styles.css";
import Container from "../../components/ui_components/Container";
import { type AccordianTabs } from "../Plugin";
import * as D from "../../components/ui_components/Dropdown";
import { BsChevronDown } from "react-icons/bs";
import { useAtomValue, useSetAtom, useAtom } from "jotai";
import { hash } from "starknet";

// Imported Atoms
import {
	activeTomlPathAtom,
	CompilationStatus,
	currentFilenameAtom,
	isCompilingAtom,
	statusAtom,
	tomlPathsAtom
} from "../../atoms/compilation";
import useRemixClient from "../../hooks/useRemixClient";
import { useIcon } from "../../hooks/useIcons";
import { type CompilationResult, type Contract, type CompilationRequest } from "../../utils/types/contracts";
import { asyncFetch } from "../../utils/async_fetch";
import { compiledContractsAtom } from "../../atoms/compiledContracts";

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

	const currentFilename = useAtomValue(currentFilenameAtom);
	const tomlPaths = useAtomValue(tomlPathsAtom);
	const activeTomlPath = useAtomValue(activeTomlPathAtom);

	const setActiveTomlPath = useSetAtom(activeTomlPathAtom);

	const isCompiling = useAtomValue(isCompilingAtom);

	const isCurrentFileName = currentFilename === "" || currentFilename === null || currentFilename === undefined;

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
												{status}
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

	const [contracts, setContracts] = useAtom(compiledContractsAtom);
	// const [selectedContract, setSelectedContract] = useAtom(selectedCompiledContractAtom);

	const currentFilename = useAtomValue(currentFilenameAtom);
	const tomlPaths = useAtomValue(tomlPathsAtom);
	const activeTomlPath = useAtomValue(activeTomlPathAtom);

	const setStatus = useSetAtom(statusAtom);
	const setCurrentFilename = useSetAtom(currentFilenameAtom);
	const setTomlPaths = useSetAtom(tomlPathsAtom);
	const setActiveTomlPath = useSetAtom(activeTomlPathAtom);
	const setIsCompiling = useSetAtom(isCompilingAtom);
	const [currWorkspacePath, setCurrWorkspacePath] = React.useState<string>("");

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		setTimeout(async () => {
			if (currentFilename !== "") {
				try {
					// get current file
					const currentFile = await remixClient.call("fileManager", "getCurrentFile");
					if (currentFile.length > 0) {
						const filename = getFileNameFromPath(currentFile);
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
				}
			}

			remixClient.on("fileManager", "currentFileChanged", (currentFileChanged: any) => {
				const filename = getFileNameFromPath(currentFileChanged);
				setCurrentFilename(filename);
				remixClient.emit("statusChanged", {
					key: "succeed",
					type: "info",
					title: "Current file: " + currentFilename
				});
			});
		}, 500);
	}, [remixClient, currentFilename]);

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
			console.log("Failed to get toml paths, function ended up with error: ", e);
		}
		return resTomlPaths;
	}

	// const getFolderFilemapRecursive = async (
	// 	workspacePath: string,
	// 	dirPath = ""
	// ): Promise<ContractFile[]> => {
	// 	const files = [] as ContractFile[];
	// 	const pathFiles = await remixClient.fileManager.readdir(`${workspacePath}/${dirPath}`);
	// 	for (const [path, entry] of Object.entries<any>(pathFiles)) {
	// 		if (entry.isDirectory === true) {
	// 			const deps = await getFolderFilemapRecursive(workspacePath, path);
	// 			for (const dep of deps) files.push(dep);
	// 			continue;
	// 		}

	// 		const content = await remixClient.fileManager.readFile(path);

	// 		if (!path.endsWith(".cairo") && !path.endsWith("Scarb.toml")) continue;

	// 		files.push({
	// 			file_name: path,
	// 			real_path: path,
	// 			file_content: content
	// 		});
	// 	}
	// 	return files;
	// };

	const updateTomlPaths = (): void => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		setTimeout(async () => {
			try {
				if (currWorkspacePath !== "") {
					const allTomlPaths = await getTomlPaths(currWorkspacePath, "");
					setTomlPaths(allTomlPaths);
				}
			} catch (e) {
				console.log("error: ", e);
			}
		}, 100);
	};

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		setTimeout(async () => {
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
			if (currWorkspacePath !== "") {
				updateTomlPaths();
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
				updateTomlPaths();
			});

			remixClient.on("fileManager", "fileAdded", (_: any) => {
				updateTomlPaths();
			});

			remixClient.on("fileManager", "folderAdded", (_: any) => {
				updateTomlPaths();
			});

			remixClient.on("fileManager", "fileRemoved", (_: any) => {
				updateTomlPaths();
			});

			remixClient.on("filePanel", "workspaceCreated", (_: any) => {
				updateTomlPaths();
			});

			remixClient.on("filePanel", "workspaceRenamed", (_: any) => {
				updateTomlPaths();
			});
		}, 500);
	}, [remixClient]);

	async function compile (compilationRequest: CompilationRequest): Promise<CompilationResult | null> {
		setIsCompiling(true);
		setStatus(CompilationStatus.Compiling);

		try {
			const result = await asyncFetch("/compile-async", "compile-result", compilationRequest);

			const resultJson = JSON.parse(result) as CompilationResult;

			console.log(resultJson);

			if (resultJson.status !== "Success") {
				await remixClient.call(
					"notification" as any,
					"toast",
					"Cairo compilation request failed"
				);

				await remixClient.terminal.log({
					type: "error",
					value: resultJson.message
				});

				throw new Error("Cairo Compilation Request Failed");
			} else {
				await remixClient.call(
					"notification" as any,
					"toast",
					"Cairo compilation request successful"
				);
			}

			await writeResultsToArtifacts(resultJson);

			setIsCompiling(false);
			return resultJson;
		} catch (error) {
			setStatus(CompilationStatus.Error);
			setIsCompiling(false);

			return null;
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

		// First pass to collect artifacts
		for (const file of compileResult.artifacts) {
			const basePath = file.real_path.replace(".compiled_contract_class.json", "").replace(".contract_class.json", "");
			if (!(basePath in contractToArtifacts)) {
				contractToArtifacts[basePath] = { casm: "", sierra: "" };
			}

			if (file.real_path.endsWith(".sierra.json")) {
				contractToArtifacts[basePath].sierra = file.file_content;
			} else if (file.real_path.endsWith(".casm.json")) {
				contractToArtifacts[basePath].casm = file.file_content;
			}
		}

		// Create or update contracts
		const updatedContracts: Contract[] = [];
		for (const [path, artifacts] of Object.entries(contractToArtifacts)) {
			const sierraContent = JSON.parse(artifacts.sierra);
			const casmContent = JSON.parse(artifacts.casm);
			const name = path.split("/").at(-1) ?? path;

			const classHash = artifacts.sierra;
			const compiledClassHash = hash.computeCompiledClassHash(casmContent);
			const sierraClassHash = hash.computeSierraContractClassHash(sierraContent);

			// Create new contract
			const newContract: Contract = {
				name,
				path,
				abi: sierraContent.abi,
				sierra: artifacts.sierra,
				casm: casmContent,
				classHash,
				compiledClassHash,
				sierraClassHash,
				deployedInfo: [],
				declaredInfo: [],
				address: ""
			};

			updatedContracts.push(newContract);
		}

		// Update contracts state with filtered + new contracts
		setContracts([...updatedContracts, ...contracts.filter((c: Contract) => !updatedContracts.some((uc: Contract) => uc.path === c.path))]);

		// Write artifacts to files
		for (const file of compileResult.artifacts) {
			const artifactsPath = `${artifactFolder(currWorkspacePath)}/${file.real_path}`;
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
			}
		}
	};

	async function compileSingle (): Promise<void> {
		await remixClient.editor.clearAnnotations();
		try {
			const currentFilePath = await remixClient.call("fileManager", "getCurrentFile");

			// request
			const compilationRequest: CompilationRequest = {
				files: [{
					file_name: currentFilePath,
					real_path: currentFilePath,
					file_content: await remixClient.call("fileManager", "readFile", currentFilePath)
				}]
			};

			const result = await compile(compilationRequest);

			if (result != null) {
				setStatus("done");
				setAccordian("deploy");
			}
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
	}

	async function compileScarb (workspacePath: string, scarbPath: string): Promise<void> {
		// try {
		// 	setStatus("Saving scarb workspace...");
		//
		// 	let result: string;
		// 	try {
		// 		// result = await asyncFetch(
		// 		// 	`compile-scarb-async/${hashDir}/${workspacePath.replace(".", "")}/${scarbPath}`,
		// 		// 	"compile-scarb-result"
		// 		// );
		// 	} catch (e) {
		// 		await remixClient.call(
		// 			"notification" as any,
		// 			"toast",
		// 			"Could not reach cairo compilation server"
		// 		);
		// 		throw new Error("Cairo Compilation Request Failed");
		// 	}
		// 	const scarbCompile: ScarbCompileResponse = JSON.parse(result);
		// 	if (scarbCompile.status !== "Success") {
		// 		await remixClient.call("notification" as any, "alert", {
		// 			id: "starknetRemixPluginAlert",
		// 			title: "Scarb compilation failed!",
		// 			message: "Scarb compilation failed!, you can read logs in the terminal console"
		// 		});
		// 		remixClient.emit("statusChanged", {
		// 			key: "failed",
		// 			type: "error",
		// 			title: "Scarb compilation failed!"
		// 		});
		// 		await remixClient.terminal.log({
		// 			type: "error",
		// 			value: scarbCompile.message
		// 		});
		// 		throw new Error("Cairo Compilation Request Failed");
		// 	}
		//
		// 	remixClient.emit("statusChanged", {
		// 		key: "succeed",
		// 		type: "success",
		// 		title: "Scarb compilation successful"
		// 	});
		//
		// 	setStatus("Analyzing contracts...");
		//
		// 	let notifyCasmInclusion = false;
		//
		// 	const contractsToStore: Contract[] = [];
		//
		// 	for (const file of scarbCompile.file_content_map_array) {
		// 		if (file.file_name?.endsWith(".contract_class.json")) {
		// 			const contractName: string = file.file_name.replace(".contract_class.json", "");
		// 			const sierra = JSON.parse(file.file_content);
		// 			if (
		// 				scarbCompile.file_content_map_array?.find(
		// 					(file: { file_name: string }) =>
		// 						file.file_name === contractName + ".compiled_contract_class.json"
		// 				) == null
		// 			) {
		// 				notifyCasmInclusion = true;
		// 				continue;
		// 			}
		// 			const casm = JSON.parse(
		// 				scarbCompile.file_content_map_array.find(
		// 					(file: { file_name: string }) =>
		// 						file.file_name === contractName + ".compiled_contract_class.json"
		// 				)?.file_content ?? ""
		// 			);
		// 			const genContract = await genContractData(
		// 				contractName,
		// 				file.file_name,
		// 				JSON.stringify(sierra),
		// 				JSON.stringify(casm)
		// 			);
		// 			if (genContract != null) contractsToStore.push(genContract);
		// 		}
		// 	}
		//
		// 	if (contractsToStore.length >= 1) {
		// 		setSelectedContract(contractsToStore[0]);
		// 		setContracts([...contractsToStore, ...contracts]);
		// 	} else {
		// 		if (selectedContract == null) setSelectedContract(contracts[0]);
		// 	}
		// 	if (notifyCasmInclusion) {
		// 		await remixClient.call(
		// 			"notification" as any,
		// 			"toast",
		// 			"Please include 'casm=true' in the Scarb.toml to deploy cairo contracts"
		// 		);
		// 	}
		//
		// 	setStatus("Saving compilation output files...");
		// 	try {
		// 		for (const file of scarbCompile.file_content_map_array) {
		// 			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		// 			const filePath = `${scarbPath}/target/dev/${file.file_name}`;
		// 			await remixClient.call(
		// 				"fileManager",
		// 				"writeFile",
		// 				filePath,
		// 				JSON.stringify(JSON.parse(file.file_content))
		// 			);
		// 		}
		// 		await remixClient.call(
		// 			"notification" as any,
		// 			"toast",
		// 			`Compilation resultant files are written to ${scarbPath}/target/dev directory`
		// 		);
		// 	} catch (e) {
		// 		if (e instanceof Error) {
		// 			await remixClient.call(
		// 				"notification" as any,
		// 				"toast",
		// 				e.message + " try deleting the dir: " + scarbPath + "target/dev"
		// 			);
		// 		}
		// 		remixClient.emit("statusChanged", {
		// 			key: "succeed",
		// 			type: "warning",
		// 			title: "Failed to save artifacts"
		// 		});
		// 	}
		// 	setStatus("done");
		// 	setAccordian("deploy");
		// } catch (e) {
		// 	setStatus("failed");
		// 	console.log("error: ", e);
		// }
	}

	// async function genContractData (
	// 	contractName: string,
	// 	path: string,
	// 	sierraFile: string,
	// 	casmFile: string
	// ): Promise<Contract | null> {
	// 	const sierra = await JSON.parse(sierraFile);
	// 	const casm = await JSON.parse(casmFile);
	// 	const compiledClassHash = hash.computeCompiledClassHash(casm);
	// 	const classHash = hash.computeContractClassHash(sierraFile);
	// 	const sierraClassHash = hash.computeSierraContractClassHash(sierra);
	// 	if (
	// 		contracts.find(
	// 			(contract: Contract) =>
	// 				contract.classHash === classHash &&
	// 				contract.compiledClassHash === compiledClassHash
	// 		) != null
	// 	) {
	// 		return null;
	// 	}
	// 	const contract = {
	// 		name: contractName,
	// 		abi: sierra.abi,
	// 		compiledClassHash,
	// 		classHash,
	// 		sierraClassHash,
	// 		sierra: sierraFile,
	// 		casm,
	// 		path,
	// 		deployedInfo: [],
	// 		address: "",
	// 		declaredInfo: []
	// 	};

	// 	return contract;
	// }

	return (
		<div>
			<CompilationCard
				validation={isValidCairo(currentFilename)}
				isLoading={useAtomValue(statusAtom) === CompilationStatus.Compiling}
				onClick={compileSingle}
				compileScarb={compileScarb}
				currentWorkspacePath={currWorkspacePath}
			/>
		</div>
	);
};

export default Compilation;
