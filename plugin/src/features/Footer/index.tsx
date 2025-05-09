import React from "react";
import Nethermind from "../../components/NM";
import "./styles.css";
import { useAtomValue } from "jotai";
import { cairoVersionAtom } from "../../atoms/cairoVersion";
import LoadingDots from "../../components/LoadingDots";

const Footer: React.FC = () => {
	const version = useAtomValue(cairoVersionAtom);

	return (
		<div className="version-wrapper">
			<div>
				<label className="version-left">
					<span>Using Cairo: </span>
					<span>{version !== null ? version : <LoadingDots message="Loading" />}</span>
				</label>
			</div>
			<div className="version-right">
				<label className="nethermind-powered">
					<span>Powered by: </span>
					<Nethermind size="xs" />
				</label>
			</div>
		</div>
	);
};

export default Footer;
