import React, { useEffect, useRef } from "react";
import { type Transaction } from "../../utils/types/transaction";
import "./styles.css";
import { type Network, networkEquivalentsRev, type networkExplorerUrls } from "../../utils/constants";
import { getExplorerUrl, getShortenedHash } from "../../utils/utils";

interface TagType {
	type: "deploy" | "declare" | "invoke" | "deployAccount";
}

const Tag: React.FC<TagType> = ({ type }) => {
	return (
		<span className={`p-2 tag tag-${type}`}>
			{type === "deployAccount" ? "deploy account" : type}
		</span>
	);
};

interface NetworkTypeTag {
	type: string;
}

const transformTypeToText = (type: string): string => {
	switch (type) {
		case "localDevnet":
			return "Local Devnet";
		case "remoteDevnet":
			return "Remote Devnet";
		case "localKatanaDevnet":
			return "Local Katana Devnet";
		default:
			return type;
	}
};

const NetworkTag: React.FC<NetworkTypeTag> = ({ type }) => {
	return <span className={`p-2 tag tag-${type}`}>{transformTypeToText(type)}</span>;
};

interface TransactionCardProps {
	transaction: Transaction;
	explorer: keyof typeof networkExplorerUrls;
}

const Index: React.FC<TransactionCardProps> = ({
	transaction,
	explorer
}) => {
	const {
		account,
		txId,
		env
	} = transaction;

	const txIdShort = getShortenedHash(txId, 8, 6);
	const accountShort = getShortenedHash(account?.address ?? "", 8, 6);

	const cardRef = useRef<HTMLDivElement>(null);
	const [chain, setChain] = React.useState<string>("goerli");

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		setTimeout(async () => {
			if (transaction.provider == null) return;
			const chainId = await transaction.provider.getChainId();
			setChain(networkEquivalentsRev.get(chainId) ?? "unknown");
		});
	});

	return (
		<div className="maincard" ref={cardRef}>
			<div className={"txn-info-1"}>
				<div className="account-wrapper">
					<p className={"label-tx"}>From:</p>
					{env === "localDevnet" ||
					env === "remoteDevnet" ||
					env === "localKatanaDevnet"
						? (
							<a title={account?.address} target="_blank" rel="noreferrer">
								{accountShort}
							</a>
						)
						: (
							<a
								title={account?.address}
								href={`${getExplorerUrl(explorer, chain as Network)}/contract/${
									account?.address ?? ""
								}`}
								target="_blank"
								rel="noreferrer"
							>
								{accountShort}
							</a>
						)}
				</div>
				<div className="txn-wrapper">
					<p className={"label-tx"}>TxID:</p>
					{env === "localDevnet" ||
					env === "remoteDevnet" ||
					env === "localKatanaDevnet"
						? (
							<a target="_blank" title={txId} rel="noreferrer">
								{txIdShort}
							</a>
						)
						: (
							<a
								href={`${getExplorerUrl(explorer, chain as Network)}/tx/${txId}`}
								target="_blank"
								title={txIdShort}
								rel="noreferrer"
							>
								{txIdShort}
							</a>
						)}
				</div>
			</div>
			<div className={"txn-info-2"}>
				<div className="tag-wrapper">
					<Tag type={transaction.type} />
				</div>
				<div className="txn-network">
					<NetworkTag
						type={
							env === "localDevnet" ||
							env === "remoteDevnet" ||
							env === "localKatanaDevnet"
								? env
								: chain
						}
					/>
				</div>
			</div>
		</div>
	);
};

export default Index;
