import React from "react";

import "./styles.css";
import { useIcon } from "../../hooks/useIcons";

const sizeToDimenstions = (
	size: "lg" | "sm" | "xs" | "md" | "xl"
): {
	h: number;
	w: number;
} => {
	const baseW = 130 * 4.5;
	const baseH = 19 * 4.5;
	switch (size) {
		case "lg":
			return { h: baseH * 1, w: baseW * 1 };
		case "xs":
			return { h: baseH * 0.2, w: baseW * 0.2 };
		case "sm":
			return { h: baseH * 0.5, w: baseW * 0.5 };
		case "md":
			return { h: baseH * 0.7, w: baseW * 0.7 };
		case "xl":
			return { h: baseH * 1.5, w: baseW * 1.5 };
	}
	return { h: baseH, w: baseW };
};

interface INethermind {
	size?: "lg" | "sm" | "xl" | "xs" | "md";
}

const Nethermind: React.FC<INethermind> = ({ size = "xs" }): React.ReactElement => {
	const sz = sizeToDimenstions(size);
	return (
		<a href={"https://nethermind.io"} target={"_blank"} rel="noreferrer">
			<img width={sz.w} height={sz.h} src={useIcon("nethermind-logo.svg")}></img>
		</a>
	);
};

export default Nethermind;
