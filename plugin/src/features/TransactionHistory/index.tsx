import React from "react";
import Container from "../../components/ui_components/Container";
import Index from "../../components/TransactionCard";
import { type IExplorerSelector } from "../../utils/misc";
import { useAtomValue } from "jotai";
import transactionsAtom from "../../atoms/transactions";
import { Transaction } from "@/utils/types/transaction";

const TransactionHistory: React.FC<IExplorerSelector> = (props) => {
	const transactions = useAtomValue(transactionsAtom);
	return (
		<Container>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "0.8rem"
				}}
			>
				{transactions.length === 0
					? (
						<div className={"w-100 text-center font-bold pt-4"}>No transactions yet</div>
					)
					: (
						transactions.map((transaction: Transaction) => {
							return (
								<Index
									key={transaction.txId}
									transaction={transaction}
									explorer={props.controlHook.explorer}
								/>
							);
						})
					)}
			</div>
		</Container>
	);
};

export default TransactionHistory;
