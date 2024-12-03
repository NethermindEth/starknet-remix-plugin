import React from "react";
import "./overlay.css";

const FullScreenOverlay: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => {
	return <div className={"full-overlay"}>{children}</div>;
};

export default FullScreenOverlay;
