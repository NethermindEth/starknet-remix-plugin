import React from "react";

import "./styles.css";
import { MdCheckCircleOutline, MdErrorOutline } from "react-icons/md";

interface IStateAction {
	value?: "loading" | "success" | "error" | "";
}

const StateAction: React.FC<IStateAction> = ({ value }) => {
	switch (value) {
		case "loading":
			return (
				<span
					className="spinner-border spinner-border-sm"
					role="status"
					aria-hidden="true"
				/>
			);
		case "success":
			return <MdCheckCircleOutline color="green" size={18} />;
		case "error":
			return <MdErrorOutline color="red" size={18} />;
		default:
			return <></>;
	}
};

export default StateAction;
