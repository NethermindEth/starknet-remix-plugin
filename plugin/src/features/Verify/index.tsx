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
import { useApi } from "../../utils/api";
import { apiUrl } from "../../utils/network";

const Verify: React.FC<IExplorerSelector> = (props) => {
	const [verifyStatus, setVerifyStatus] = useAtom(verifyStatusAtom);
	const [contractNames, setContractNames] = useState<string[]>([]);
	const [activeContractName, setActiveContractName] = useState("");
	const [contractAddress, setContractAddress] = useState("");
	const [network, setNetwork] = useState<"mainnet" | "sepolia">("sepolia");

	const { remixClient } = useRemixClient();
	const activeTomlPath = useAtomValue(activeTomlPathAtom);

	const api = useApi(apiUrl);

	useEffect(() => {
		if (activeContractName === "" || !contractNames.includes(activeContractName)) {
			setActiveContractName(contractNames[0]);
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
				if (match?.[2] != null) {
					const contractName = match[2];
					contractNames.push(contractName);
				}
			}
		}

		setContractNames(contractNames);
	};

	useEffect(() => {
		fetchContractNames().catch(console.error);
	}, []);
	useEffect(() => {
		fetchContractNames().catch(console.error);
	}, [activeTomlPath]);

	useEffect(() => {
		remixClient.on("fileManager", "fileSaved", fetchContractNames);
	}, [remixClient]);

	const handleVerify = (e: React.FormEvent): void => {
		e.preventDefault();
		setVerifyStatus("loading");

		const verifyContract = async (): Promise<void> => {
			try {
				// TODO: Implement verification logic
				const response = await api.verify({
					contract_name: activeContractName,
					contract_address: contractAddress,
					network,
					files: await getFolderFilemapRecursive(
						(await remixClient.filePanel.getCurrentWorkspace()).absolutePath,
						remixClient,
						activeTomlPath
					)
				});

				if (response.success) {
					setVerifyStatus("success");
				} else {
					setVerifyStatus("error");
				}
			} catch (error) {
				console.error("Verification failed:", error);
				setVerifyStatus("error");
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
							<label htmlFor="contractAddress">CONTRACT ADDRESS</label>
							<input
								id="contractAddress"
								type="text"
								value={contractAddress}
								onChange={(e): void => {
									setContractAddress(e.target.value);
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

						<button
							type="submit"
							disabled={verifyStatus === "loading"}
							className="btn btn-primary mt-4"
						>
							{verifyStatus === "loading" ? "Verifying..." : "Verify Contract"}
						</button>
					</div>
				</form>

				{verifyStatus === "success" && (
					<div className="verify-status success">
						Contract verified successfully!
					</div>
				)}
				{verifyStatus === "error" && (
					<div className="verify-status error">
						Failed to verify contract. Please check your inputs and try again.
					</div>
				)}
			</div>
		</Container>
	);
};

export default Verify;
