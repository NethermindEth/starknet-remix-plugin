import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAtom, useAtomValue } from "jotai";
import { BsX } from "react-icons/bs";
import { envAtom } from "../../atoms/environment";
import { compiledContractsAtom, deployedContractsAtom } from "../../atoms/compiledContracts";
import * as Select from "../ui_components/Select";
import "./styles.css";
import type { Contract } from "../../utils/types/contracts";
import { fetchClassHashAt, fetchContractClass } from "../../utils/rpc";
import useProvider from "../../hooks/useProvider";

interface AddDeployedContractProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

type ContractSource = "rpc" | "artifact";

const AddDeployedContract: React.FC<AddDeployedContractProps> = ({ isOpen, onOpenChange }) => {
	const env = useAtomValue(envAtom);
	const [compiledContracts] = useAtom(compiledContractsAtom);
	const [deployedContracts, setDeployedContracts] = useAtom(deployedContractsAtom);
	const { provider } = useProvider();

	const [contractSource, setContractSource] = useState<ContractSource>("artifact");
	const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
	const [contractAddress, setContractAddress] = useState("");
	const [classHash, setClassHash] = useState("");
	const [contractName, setContractName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleAddContract = async (): Promise<void> => {
		if (selectedContract === null && contractAddress === "") {
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			if (contractSource === "rpc") {
				if (provider === null) {
					throw new Error("Provider not available");
				}

				// Always fetch class hash from the contract address in RPC mode
				const fetchedClassHash = await fetchClassHashAt(
					provider,
					contractAddress
				);
				if (fetchedClassHash === null) {
					throw new Error("Failed to fetch class hash for the contract");
				}

				// Fetch contract class using the fetched class hash
				const contractClass = await fetchContractClass(
					provider,
					fetchedClassHash
				);

				if (contractClass === null) {
					throw new Error("Failed to fetch contract class");
				}

				const newContract = {
					...contractClass,
					name: contractName !== "" ? contractName : "Contract from RPC",
					address: contractAddress,
					classHash: fetchedClassHash
				};

				setDeployedContracts([...deployedContracts, newContract]);
			} else {
				if (selectedContract === null) {
					return;
				}

				const newContract = {
					...selectedContract,
					name: contractName !== "" ? contractName : selectedContract.name,
					address: contractAddress,
					classHash: selectedContract.classHash
				};

				setDeployedContracts([...deployedContracts, newContract]);
			}

			resetForm();
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const resetForm = (): void => {
		setSelectedContract(null);
		setContractAddress("");
		setClassHash("");
		setContractName("");
		setContractSource("artifact");
		setError(null);
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="add-contract-overlay" />
				<Dialog.Content className="add-contract-content">
					<div className="add-contract-header">
						<Dialog.Title className="add-contract-title">Add Deployed Contract</Dialog.Title>
						<Dialog.Close asChild>
							<button className="close-button" aria-label="Close">
								<BsX size={20} />
							</button>
						</Dialog.Close>
					</div>

					<div className="add-contract-form">
						<div className="form-group">
							<label>Environment</label>
							<input
								type="text"
								value={env}
								disabled
								className="form-input"
							/>
						</div>

						<div className="form-group">
							<label>Contract Source</label>
							<div className="source-toggle">
								<button
									className={`source-button ${contractSource === "artifact" ? "active" : ""}`}
									onClick={(): void => {
										setContractSource("artifact");
									}}
								>
									Compiled Artifact
								</button>
								<button
									className={`source-button ${contractSource === "rpc" ? "active" : ""}`}
									onClick={(): void => {
										setContractSource("rpc");
									}}
								>
									Fetch from RPC
								</button>
							</div>
						</div>

						{contractSource === "artifact" && (
							<div className="form-group">
								<label>Select Contract</label>
								<Select.Root
									value={selectedContract?.name ?? ""}
									onValueChange={(value: string): void => {
										const contract = compiledContracts.find(c => c.name === value);
										if (contract !== undefined) {
											setSelectedContract(contract);
											setClassHash(contract.classHash ?? "");
											setContractName(contract.name);
										}
									}}
								>
									<Select.Trigger className="form-select">
										<Select.Value placeholder="Select a contract" />
									</Select.Trigger>
									<Select.Portal>
										<Select.Content>
											<Select.Viewport>
												{compiledContracts.map((contract, index) => (
													<Select.Item
														key={`${contract.name}-${index}`}
														value={contract.name}
													>
														<Select.ItemText>{contract.name}</Select.ItemText>
													</Select.Item>
												))}
											</Select.Viewport>
										</Select.Content>
									</Select.Portal>
								</Select.Root>
							</div>
						)}

						<div className="form-group">
							<label>Contract Name</label>
							<input
								type="text"
								placeholder={contractSource === "artifact" ? "Optional custom name" : "Enter contract name"}
								value={contractName}
								onChange={(e): void => {
									setContractName(e.target.value);
								}}
								className="form-input"
							/>
						</div>

						<div className="form-group">
							<label>Contract Address</label>
							<input
								type="text"
								placeholder="Enter contract address"
								value={contractAddress}
								onChange={(e): void => {
									setContractAddress(e.target.value);
								}}
								className="form-input"
							/>
						</div>

						{contractSource === "artifact" && selectedContract !== null && (
							<div className="form-group">
								<label>Class Hash</label>
								<input
									type="text"
									value={classHash}
									disabled
									className="form-input"
								/>
							</div>
						)}

						{error !== null && (
							<div className="error-message">
								{error}
							</div>
						)}

						<div className="form-actions">
							<button
								onClick={(): void => {
									resetForm();
									onOpenChange(false);
								}}
								className="cancel-button"
								disabled={isLoading}
							>
								Cancel
							</button>
							<button
								onClick={(): void => {
									void handleAddContract();
								}}
								className="confirm-button"
								disabled={
									isLoading ||
									contractAddress === "" ||
									(contractSource === "artifact" && selectedContract === null)
								}
							>
								{isLoading ? "Loading..." : "Add Contract"}
							</button>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};

export default AddDeployedContract;
