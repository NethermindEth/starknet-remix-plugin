import { useState, useEffect } from "react";
import useRemixClient from "./useRemixClient";
import { Theme } from "@remixproject/plugin-api";

export const useIcon = (name: string): string => {
	const { remixClient } = useRemixClient();
	const [remixTheme, setRemixTheme] = useState("dark");

	useEffect(() => {
		const loadTheme = async (): Promise<void> => {
			try {
				const currentTheme = await remixClient.call("theme", "currentTheme");
				console.log("currentTheme", currentTheme);
				setRemixTheme(currentTheme.brightness ?? currentTheme.quality ?? "dark");
			} catch (error) {
				console.error(error);
			}
		};

		const updateTheme = (theme: Theme): void => {
			console.log("updateTheme", theme);
			setRemixTheme(theme.brightness ?? theme.quality ?? "dark");
		};

		loadTheme().catch(console.error);

		remixClient.on("theme", "themeChanged", updateTheme);

		return () => {
			remixClient.off("theme", "themeChanged");
		};
	}, [remixClient]);

	return `/${remixTheme}-${name}`;
};
