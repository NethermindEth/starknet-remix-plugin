import type { Contract } from "./types/contracts";

export async function saveContractArtifact(contract: Contract): Promise<void> {
	try {
		const response = await fetch("/api/save-artifact", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				name: contract.name,
				artifact: contract
			})
		});

		if (!response.ok) {
			throw new Error("Failed to save contract artifact");
		}
	} catch (error) {
		console.error("Error saving contract artifact:", error);
		throw error;
	}
}
