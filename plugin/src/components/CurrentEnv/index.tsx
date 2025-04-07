import React from "react";
import "./styles.css";
import Wallet from "../Wallet";

export const CurrentEnv: React.FC = () => {
	return (
		<div className={"current-env-root"}>
			<div className={"chain-info-box"}>
				<Wallet />
			</div>
		</div>
	);
};
