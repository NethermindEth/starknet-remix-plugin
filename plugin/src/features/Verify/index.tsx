import React, { useEffect, useState } from "react";
import Container from "../../components/ui_components/Container";
import { type IExplorerSelector } from "../../utils/misc";
import { verifyStatusAtom } from "../../atoms/verify";
import { useAtom, useAtomValue } from "jotai";
import * as Select from "../../components/ui_components/Select";
import { BsChevronDown } from "react-icons/bs";
import "./styles.css";
import { activeTomlPathAtom } from "../../atoms/compilation";

const Verify: React.FC<IExplorerSelector> = (props) => {
	const [verifyStatus, setVerifyStatus] = useAtom(verifyStatusAtom);
	const [contractNames, setContractNames] = useState([""]);
	const [activeContractName, setActiveContractName] = useState("");
	const [contractAddress, setContractAddress] = useState("");
	const [classHash, setClassHash] = useState("");

	const activeTomlPath = useAtomValue(activeTomlPathAtom);

	useEffect(() => {
		setContractNames(["Hello", "World"]);
	}, []);

	useEffect(() => {
		setActiveContractName(contractNames[0]);
	}, [contractNames]);

	const handleVerify = (e: React.FormEvent): void => {
		e.preventDefault();
		setVerifyStatus("loading");

		const verifyContract = async (): Promise<void> => {
			try {
				// TODO: Implement verification logic using Walnut
				setVerifyStatus("success");
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
				<h2 className="text-xl font-bold mb-4">Contract Verification</h2>
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
