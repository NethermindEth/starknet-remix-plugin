import React, { useState } from "react";
import copy from "copy-to-clipboard";
import "./styles.css";
import { MdCheck, MdCopyAll, MdLogout, MdInfo } from "react-icons/md";
import { useCurrentExplorer } from "../ExplorerSelector";
import { getExplorerUrl, trimStr } from "../../utils/utils";
import { useAccount, useDisconnect, useNetwork } from "@starknet-react/core";
import ConnectModal from "../starknet/connect";
import { formatWalletAddress, getChainName } from "../../utils/starknet";
import { Network } from "@/utils/constants";

const Wallet: React.FC = () => {
	const { disconnect } = useDisconnect();

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
		<>
			{status === "connected"
				? (
					<>
						<div className="wallet-actions">
							<a href="https://nethermind.io" target="_blank" rel="noopener noreferrer">
								<img src={connector !== undefined ? (typeof connector.icon === "string" ? connector.icon : connector.icon.dark) : ""} alt="wallet icon" className="wallet-wrapper-icon" />
							</a>
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
									{trimStr(formattedAddress ?? "", 6)}
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
										<button
											className={"btn btn-warning justify-cente flex-col flex w-full rounded"}
											onClick={() => {
												disconnect();
												setShowDisconnectModal(false);
											}}
										>
											Disconnect
										</button>
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
		</>
	);
};

export default Wallet;
