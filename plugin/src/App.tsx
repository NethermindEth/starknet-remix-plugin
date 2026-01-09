import React from "react";

import "./App.css";
import Plugin from "./features/Plugin";
import Loader from "./components/ui_components/CircularLoader";
import FullScreenOverlay from "./components/ui_components/FullScreenOverlay";
import useRemixClient from "./hooks/useRemixClient";

const App: React.FC = () => {
	const { remixClient } = useRemixClient();

	return (
		<div className="shell bg-primary">
			{remixClient.isLoaded
				? (
					<Plugin />
				)
				: (
					<FullScreenOverlay>
						<Loader />
					</FullScreenOverlay>
				)}
		</div>
	);
};

export default App;
