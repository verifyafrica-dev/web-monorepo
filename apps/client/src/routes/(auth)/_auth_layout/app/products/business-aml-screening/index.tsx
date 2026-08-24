import { ArrowLeftIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@verifyafrica/ui/components/ui/button";
import { getProduct } from "../-data";
import { BusinessAmlScreeningForm } from "./-components/business-aml-screening-form";
import { BusinessAmlScreeningInfoPanel } from "./-components/business-aml-screening-info-panel";

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/products/business-aml-screening/",
)({
	head: () => ({
		meta: [
			{ title: "Business AML Screening | VerifyAfrica" },
			{ name: "description", content: "Screen businesses for AML, sanctions, and compliance risks." },
		],
	}),
	component: BusinessAmlScreeningPage,
});

function BusinessAmlScreeningPage() {
	const product = getProduct("business-aml-screening");

	if (!product) {
		return null;
	}

	return (
		<div className="flex flex-col gap-6">
			<Button variant="ghost" className="w-fit px-4" asChild>
				<Link to="/app/products">
					<ArrowLeftIcon />
					Back to Products
				</Link>
			</Button>

			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					{product.title}
				</h1>
				<p className="max-w-3xl text-sm text-muted-foreground">
					{product.description}
				</p>
			</div>

			<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
				<BusinessAmlScreeningForm />
				<BusinessAmlScreeningInfoPanel />
			</div>
		</div>
	);
}
