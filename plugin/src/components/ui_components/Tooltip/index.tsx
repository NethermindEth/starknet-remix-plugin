import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import "./tooltip.css";

interface ITooltip {
	icon: React.ReactNode;
	content: string | React.ReactNode;
}
const Tooltip: React.FC<ITooltip> = ({ icon, content }) => {
	return (
		<TooltipPrimitive.Provider delayDuration={100}>
			<TooltipPrimitive.Root>
				<TooltipPrimitive.Trigger asChild>
					<button className="TooltipIconButton">{icon}</button>
				</TooltipPrimitive.Trigger>
				<TooltipPrimitive.Portal>
					<TooltipPrimitive.Content className="TooltipContent" sideOffset={5}>
						{content}
						<TooltipPrimitive.Arrow className="TooltipArrow" />
					</TooltipPrimitive.Content>
				</TooltipPrimitive.Portal>
			</TooltipPrimitive.Root>
		</TooltipPrimitive.Provider>
	);
};

export default Tooltip;
