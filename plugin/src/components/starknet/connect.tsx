import { Button, Flex, Heading, Image } from "@chakra-ui/react";
import { type Connector, useConnect } from "@starknet-react/core";
import React, { useEffect, useState } from "react";
import {
	type StarknetkitConnector,
	useStarknetkitConnectModal
} from "starknetkit";
import { availableConnectors } from "./connectors";

const ConnectModal = (): React.ReactElement => {
	const { connectAsync, connectors } = useConnect();
	const [isClient, setIsClient] = useState(false);

	const { starknetkitConnectModal } = useStarknetkitConnectModal({
		connectors: availableConnectors as StarknetkitConnector[]
	});

	// https://nextjs.org/docs/messages/react-hydration-error#solution-1-using-useeffect-to-run-on-the-client-only
	// starknet react had an issue with the `available` method
	// need to check their code, probably is executed only on client causing an hydration issue

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return <></>;
	}

	const handleConnectorClick = async (connector: Connector): Promise<void> => {
		await connectAsync({ connector });
	};

	const handleStarknetkitClick = async (): Promise<void> => {
		const { connector } = await starknetkitConnectModal();
		if (connector == null) return; // or throw error
		await connectAsync({ connector: connector as Connector });
	};

	return (
		<Flex direction="column" gap="3" p="5">
			<Flex direction="column" gap="3">
				{connectors.map((connector: Connector) => {
					if (!connector.available()) {
						return <React.Fragment key={connector.id} />;
					}
					const icon =
						typeof connector.icon === "string"
							? connector.icon
							: (connector.icon.dark ?? "");
					const isSvg = icon?.startsWith("<svg");

					return (
						<Button
							as="button"
							colorScheme="neutrals"
							key={connector.id}
							onClick={() => {
								handleConnectorClick(connector).catch(console.error);
							}}
							alignItems="center"
							justifyContent="flex-start"
							cursor="pointer"
							maxW="350px"
							gap="2"
							py="2"
							px="4"
						>
							{isSvg
								? (
									<div dangerouslySetInnerHTML={{ __html: icon }} />
								)
								: (
									<Image
										alt={connector.name}
										src={icon}
										height="32px"
										width="32px"
									/>
								)}
							{connector.name}
						</Button>
					);
				})}
			</Flex>

			<Heading as="h2" mt="8">
				Starknetkit modal + starknet-react
			</Heading>
			<Button
				colorScheme="neutrals"
				onClick={() => {
					handleStarknetkitClick().catch(console.error);
				}}
				alignItems="center"
				justifyContent="flex-start"
				cursor="pointer"
				maxW="350px"
				gap="2"
				py="2"
				px="4"
				mt="2"
			>
				Starknetkit modal with starknet-react
			</Button>
		</Flex>
	);
};

export default ConnectModal;
