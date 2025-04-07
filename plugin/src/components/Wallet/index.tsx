import React, { useState } from "react";
import copy from "copy-to-clipboard";
import "./styles.css";
import { MdCheck, MdCopyAll, MdLogout, MdInfo } from "react-icons/md";
import { useCurrentExplorer } from "../ExplorerSelector";
import { getExplorerUrl, trimStr } from "../../utils/utils";
import { useAccount, useNetwork } from "@starknet-react/core";
import ConnectModal from "../starknet/connect";
import DisconnectModal from "../starknet/disconnect";
import { formatWalletAddress, getChainName } from "../../utils/starknet";
import { Network } from "@/utils/constants";

const Wallet: React.FC = () => {
	const [showCopied, setCopied] = useState(false);
	const [showDisconnectModal, setShowDisconnectModal] = useState(false);

	const {
		status,
		address,
		connector
	} = useAccount();

	const { chain } = useNetwork();

	const formattedAddress = formatWalletAddress(address);
	const explorerHook = useCurrentExplorer();

	const handleDisconnect = () => {
		setShowDisconnectModal(true);
	};

	return (
		<div
			className="flex"
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "1rem",
			}}
		>
			{status === "connected"
				? (
					<>
						<div className="wallet-row-wrapper">
							<div className="wallet-wrapper">
								<img src={connector !== undefined ? (typeof connector.icon === "string" ? connector.icon : connector.icon.dark) : ""} alt="wallet icon" />
								<p className="text"> {connector?.id}</p>
								<p className="text text-right text-secondary">
									{" "}
									{getChainName(chain.id.toString() ?? "")}
								</p>
							</div>
						</div>
						<div className="wallet-actions">
							<div className="wallet-account-wrapper">
								<p className="text account" title={formattedAddress ?? ""}>
									<a
										href={`${getExplorerUrl(
											explorerHook.explorer,
											getChainName(chain.id.toString() ?? "") as Network
										)}/contract/${formattedAddress ?? ""}`}
										target="_blank"
										rel="noreferer noopener noreferrer"
										className="account-link"
									>
										{trimStr(formattedAddress ?? "", 10)}
									</a>
								</p>
								<div className="wallet-buttons">
									<button
										className="btn copy-btn"
										onClick={() => {
											copy(formattedAddress ?? "");
											setCopied(true);
											setTimeout(() => {
												setCopied(false);
											}, 1000);
										}}
										title="Copy address"
									>
										{showCopied ? <MdCheck /> : <MdCopyAll />}
									</button>
									<button
										className="btn disconnect-btn"
										onClick={handleDisconnect}
										title="Disconnect wallet"
									>
										<MdLogout />
									</button>
								</div>
							</div>
						</div>

						{showDisconnectModal && (
							<div className="disconnect-modal-overlay">
								<div className="disconnect-modal">
									<div className="modal-header">
										<MdInfo className="info-icon" />
										<h3>Disconnect Wallet</h3>
									</div>
									<p>Are you sure you want to disconnect your wallet?</p>
									<div className="modal-actions">
										<button
											className="btn cancel-btn"
											onClick={() => setShowDisconnectModal(false)}
										>
											Cancel
										</button>
										<DisconnectModal className="btn disconnect-confirm-btn">
											Disconnect
										</DisconnectModal>
									</div>
								</div>
							</div>
						)}
					</>
				)
				: (
					<>
						{status === "disconnected"
							? (
								<ConnectModal />
							)
							: (
								<>
									{status === "connecting"
										? (
											<p>Connecting...</p>
										)
										: (
											<p>Reconnecting...</p>
										)}
								</>
							)}
					</>
				)}
		</div>
	);
};

export default Wallet;
