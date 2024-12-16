import React, { useEffect, useState } from "react";

const LoadingDots: React.FC<{ message: string }> = ({ message }) => {
	const [dots, setDots] = useState("");

	useEffect(() => {
		const interval = setInterval(() => {
			setDots((prev) => {
				return prev.length >= 3 ? "" : prev + ".";
			});
		}, 500);

		return () => {
			clearInterval(interval);
		};
	}, []);

	return (
		<span className="loading-text">
			{message}{dots}
		</span>
	);
};

export default LoadingDots;
