import React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { BsChevronDown } from "react-icons/bs";
import "./styles.css";

// eslint-disable-next-line react/display-name
export const AccordionTrigger = React.forwardRef<
React.ComponentRef<typeof AccordionPrimitive.Trigger>,
React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(
	({
		children,
		...props
	}, forwardedRef) => (
		<AccordionPrimitive.Header className="AccordionHeader">
			<AccordionPrimitive.Trigger
				className={"AccordionTrigger"}
				{...props}
				ref={forwardedRef}
			>
				{children}
				<BsChevronDown className="AccordionChevron light" aria-hidden />
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	)
);

// eslint-disable-next-line react/display-name
export const AccordionContent = React.forwardRef<
React.ComponentRef<typeof AccordionPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(
	({
		children,
		...props
	}, forwardedRef) => (
		<AccordionPrimitive.Content className={"AccordionContent"} {...props} ref={forwardedRef}>
			<div className="AccordionContentText">{children}</div>
		</AccordionPrimitive.Content>
	)
);

export const AccordionItem = AccordionPrimitive.Item;

type IAccordion = AccordionPrimitive.AccordionSingleProps | AccordionPrimitive.AccordionMultipleProps;

const Accordion: React.FC<IAccordion> = (props: IAccordion) => (
	<AccordionPrimitive.Root {...props}>
		{props.children}
	</AccordionPrimitive.Root>
);

export default Accordion;
