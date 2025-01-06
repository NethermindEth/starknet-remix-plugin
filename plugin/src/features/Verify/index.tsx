import React, { useEffect, useState } from "react";
import Container from "../../components/ui_components/Container";
import { type IExplorerSelector } from "../../utils/misc";
import { verifyStatusAtom } from "../../atoms/verify";
import { useAtom, useAtomValue } from "jotai";
import * as Select from "../../components/ui_components/Select";
import { BsChevronDown } from "react-icons/bs";
import "./styles.css";
import { activeTomlPathAtom } from "../../atoms/compilation";
import { getFolderFilemapRecursive } from "../../utils/utils";
import { useRemixClient } from "../../hooks/useRemixClient";
import type { VoyagerLicense } from "../../utils/types/voyager";
import { VoyagerAPI } from "../../utils/voyager";
import { VoyagerVerificationStatus } from "../../utils/types/voyager";

const SUPPORTED_LICENSES: Array<{ id: VoyagerLicense; name: VoyagerLicense }> = [
	{ id: "No License (None)", name: "No License (None)" },
	{ id: "The Unlicense (Unlicense)", name: "The Unlicense (Unlicense)" },
	{ id: "MIT License (MIT)", name: "MIT License (MIT)" },
	{ id: "GNU General Public License v2.0 (GNU GPLv2)", name: "GNU General Public License v2.0 (GNU GPLv2)" },
	{ id: "GNU General Public License v3.0 (GNU GPLv3)", name: "GNU General Public License v3.0 (GNU GPLv3)" },
	{ id: "GNU Lesser General Public License v2.1 (GNU LGPLv2.1)", name: "GNU Lesser General Public License v2.1 (GNU LGPLv2.1)" },
	{ id: "GNU Lesser General Public License v3.0 (GNU LGPLv3)", name: "GNU Lesser General Public License v3.0 (GNU LGPLv3)" },
	{ id: "BSD 2-clause \"Simplified\" license (BSD-2-Clause)", name: "BSD 2-clause \"Simplified\" license (BSD-2-Clause)" },
	{ id: "BSD 3-clause \"New\" Or \"Revisited license (BSD-3-Clause)", name: "BSD 3-clause \"New\" Or \"Revisited license (BSD-3-Clause)" },
	{ id: "Mozilla Public License 2.0 (MPL-2.0)", name: "Mozilla Public License 2.0 (MPL-2.0)" },
	{ id: "Open Software License 3.0 (OSL-3.0)", name: "Open Software License 3.0 (OSL-3.0)" },
	{ id: "Apache 2.0 (Apache-2.0)", name: "Apache 2.0 (Apache-2.0)" },
	{ id: "GNU Affero General Public License (GNU AGPLv3)", name: "GNU Affero General Public License (GNU AGPLv3)" },
	{ id: "Business Source License (BSL 1.1)", name: "Business Source License (BSL 1.1)" }
];

const Verify: React.FC<IExplorerSelector> = (props) => {
	const [verifyStatus, setVerifyStatus] = useAtom(verifyStatusAtom);
	const [contractNames, setContractNames] = useState<string[]>([]);
	const [activeContractName, setActiveContractName] = useState("");
	const [classHash, setClassHash] = useState("");
	const [network, setNetwork] = useState<"mainnet" | "sepolia">("sepolia");
	const [compilerVersion, setCompilerVersion] = useState("");
	const [scarbVersion, setScarbVersion] = useState("");
	const [license, setLicense] = useState<VoyagerLicense>("MIT License (MIT)");
	const [isAccountContract, setIsAccountContract] = useState(false);
	const [verificationMessage, setVerificationMessage] = useState("");

	const { remixClient } = useRemixClient();
	const activeTomlPath = useAtomValue(activeTomlPathAtom);
	const voyagerApi = new VoyagerAPI();

	useEffect(() => {
		if (activeContractName === "" || !contractNames.includes(activeContractName)) {
			setActiveContractName(contractNames[0] ?? "");
		}
	}, [contractNames]);

	const fetchContractNames = async (): Promise<void> => {
		const currentWorkspacePath = await remixClient.filePanel.getCurrentWorkspace();

		const files = await getFolderFilemapRecursive(
			currentWorkspacePath.absolutePath,
			remixClient,
			activeTomlPath
		);

		const contractNames = [];

		for (const file of files) {
			const fileName = file.file_name;
			const content = file.file_content;

			if (fileName.endsWith(".cairo")) {
				const contractRegex = /#\[(starknet::)?contract\]\s*mod\s+(\w+)/;
				const match = content.match(contractRegex);
				const contractName = match?.[2];
				if (contractName !== undefined) {
					contractNames.push(contractName);
				}
			}
		}

		setContractNames(contractNames);
	};

	useEffect(() => {
		const fetchAndHandleError = async (): Promise<void> => {
			try {
				await fetchContractNames();
			} catch (error) {
				console.error(error);
			}
		};

		void fetchAndHandleError();
	}, []);

	useEffect(() => {
		const fetchAndHandleError = async (): Promise<void> => {
			try {
				await fetchContractNames();
			} catch (error) {
				console.error(error);
			}
		};

		void fetchAndHandleError();
	}, [activeTomlPath]);

	useEffect(() => {
		remixClient.on("fileManager", "fileSaved", fetchContractNames);
	}, [remixClient]);

	const handleVerify = (e: React.FormEvent): void => {
		e.preventDefault();
		setVerifyStatus("loading");
		setVerificationMessage("");

		const verifyContract = async (): Promise<void> => {
			try {
				const currentWorkspacePath = await remixClient.filePanel.getCurrentWorkspace();
				const files = await getFolderFilemapRecursive(
					currentWorkspacePath.absolutePath,
					remixClient,
					activeTomlPath
				);

				const contractFile = files.find((file) => {
					const match = file.file_content.match(/#\[(starknet::)?contract\]\s*mod\s+(\w+)/);
					const contractName = match?.[2];
					return contractName === activeContractName;
				});

				if (contractFile == null) {
					throw new Error("Contract file not found");
				}

				const request = voyagerApi.prepareVerificationRequest(
					activeContractName,
					contractFile.file_content,
					compilerVersion,
					scarbVersion,
					license,
					isAccountContract
				);

				const response = await voyagerApi.verifyContract(request, network, classHash);
				const jobId = response.job_id;

				// Poll for verification status
				const pollStatus = async (): Promise<void> => {
					try {
						const status = await voyagerApi.getVerificationStatus(jobId, network);
						setVerificationMessage(status.message ?? status.status_description);

						console.log(status.status);

						switch (status.status) {
							case VoyagerVerificationStatus.SUBMITTED:
							case VoyagerVerificationStatus.COMPILED:
								setTimeout(() => {
									void pollStatus();
								}, 5000);
								break;
							case VoyagerVerificationStatus.SUCCESS:
								setVerifyStatus("success");
								break;
							case VoyagerVerificationStatus.COMPILE_FAILED:
							case VoyagerVerificationStatus.FAIL:
								setVerifyStatus("error");
								break;
							default:
								setVerifyStatus("error");
								setVerificationMessage("Unknown verification status");
						}
					} catch (error) {
						console.error("Error polling status:", error);
						setVerifyStatus("error");
						setVerificationMessage(error instanceof Error ? error.message : "Failed to check verification status");
					}
				};

				void pollStatus();
			} catch (error) {
				console.error("Verification failed:", error);
				setVerifyStatus("error");
				if (error instanceof Error) {
					setVerificationMessage(error.message);
				} else if (typeof error === "object" && error !== null && "message" in error) {
					setVerificationMessage(String(error.message));
				} else {
					setVerificationMessage("Unknown error occurred during verification");
				}
			}
		};

		void verifyContract();
	};

	return (
		<Container>
			<div className="verify-form">
				<form onSubmit={handleVerify}>
					<div className="flex flex-col gap-4">
						<div className="verify-form-input-box">
							<label htmlFor="classHash">CLASS HASH</label>
							<input
								id="classHash"
								type="text"
								value={classHash}
								onChange={(e): void => {
									setClassHash(e.target.value);
								}}
								placeholder="0x..."
								required
							/>
						</div>

						<div className="verify-form-input-box">
							<label>NETWORK</label>
							<Select.Root
								value={network}
								onValueChange={(value: "mainnet" | "sepolia"): void => {
									setNetwork(value);
								}}
							>
								<Select.Trigger>
									<Select.Value className="SelectValue">
										{network.charAt(0).toUpperCase() + network.slice(1)}
									</Select.Value>
									<Select.Icon>
										<BsChevronDown />
									</Select.Icon>
								</Select.Trigger>
								<Select.Portal>
									<Select.Content>
										<Select.Viewport>
											<Select.Item value="mainnet">
												<Select.ItemText>Mainnet</Select.ItemText>
											</Select.Item>
											<Select.Item value="sepolia">
												<Select.ItemText>Sepolia</Select.ItemText>
											</Select.Item>
										</Select.Viewport>
									</Select.Content>
								</Select.Portal>
							</Select.Root>
						</div>

						<div className="verify-form-input-box">
							<label>CONTRACT NAME</label>
							<Select.Root
								value={activeContractName}
								onValueChange={(value: string): void => {
									setActiveContractName(value);
								}}
							>
								<Select.Trigger>
									<Select.Value className="SelectValue" placeholder="Select a contract">
										{activeContractName}
									</Select.Value>
									<Select.Icon>
										<BsChevronDown />
									</Select.Icon>
								</Select.Trigger>
								<Select.Portal>
									<Select.Content>
										<Select.Viewport>
											{contractNames.map((name) => (
												<Select.Item value={name} key={name}>
													<Select.ItemText>{name}</Select.ItemText>
												</Select.Item>
											))}
										</Select.Viewport>
									</Select.Content>
								</Select.Portal>
							</Select.Root>
						</div>

						<div className="verify-form-input-box">
							<label>LICENSE</label>
							<Select.Root
								value={license}
								onValueChange={(value: VoyagerLicense): void => {
									setLicense(value);
								}}
							>
								<Select.Trigger>
									<Select.Value className="SelectValue">
										{SUPPORTED_LICENSES.find((l) => l.id === license)?.name}
									</Select.Value>
									<Select.Icon>
										<BsChevronDown />
									</Select.Icon>
								</Select.Trigger>
								<Select.Portal>
									<Select.Content>
										<Select.Viewport>
											{SUPPORTED_LICENSES.map((license) => (
												<Select.Item value={license.id} key={license.id}>
													<Select.ItemText>{license.name}</Select.ItemText>
												</Select.Item>
											))}
										</Select.Viewport>
									</Select.Content>
								</Select.Portal>
							</Select.Root>
						</div>

						<div className="verify-form-input-box">
							<label htmlFor="compilerVersion">COMPILER VERSION</label>
							<input
								id="compilerVersion"
								type="text"
								value={compilerVersion}
								onChange={(e): void => {
									setCompilerVersion(e.target.value);
								}}
								placeholder="e.g. 2.6.4"
								required
							/>
						</div>

						<div className="verify-form-input-box">
							<label htmlFor="scarbVersion">SCARB VERSION</label>
							<input
								id="scarbVersion"
								type="text"
								value={scarbVersion}
								onChange={(e): void => {
									setScarbVersion(e.target.value);
								}}
								placeholder="e.g. 2.6.4"
								required
							/>
						</div>

						<div className="verify-form-input-box account-contract-box">
							<div className="flex items-center gap-2 checkbox-container">
								<input
									type="checkbox"
									id="accountContract"
									checked={isAccountContract}
									onChange={(e): void => {
										setIsAccountContract(e.target.checked);
									}}
									className="checkbox-tiny"
								/>
								<label htmlFor="accountContract" className="text-xm">
									Account contract
								</label>
							</div>
						</div>

						<button
							type="submit"
							disabled={verifyStatus === "loading"}
							className="btn btn-primary mt-4"
						>
							{verifyStatus === "loading" ? "Verifying..." : "Verify Contract"}
						</button>
					</div>
				</form>

				{verificationMessage !== "" && (
					<div
						className={`verify-status ${
							verifyStatus === "success"
								? "success"
								: verifyStatus === "error"
									? "error"
									: "info"
						}`}
					>
						{verificationMessage}
					</div>
				)}
			</div>
		</Container>
	);
};

export default Verify;
