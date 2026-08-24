import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { getProduct, type ProductSlug } from "./-data";

export function ProductDetailPage({ slug }: { slug: ProductSlug }) {
	const product = getProduct(slug);

	if (!product) {
		return null;
	}

	const Icon = product.icon;

	return (
		<div className="flex flex-col gap-6">
			<Button variant="ghost" className="w-fit px-4" asChild>
				<Link to="/app/products">
					<ArrowLeftIcon />
					Back to Products
				</Link>
			</Button>

			<Card>
				<CardContent className="flex flex-col gap-6">
					<div className="flex size-14 items-center justify-center rounded-md bg-secondary/10 text-secondary">
						<Icon className="size-7" weight={product.iconWeight} />
					</div>
					<div className="space-y-1.5">
						<h1 className="text-2xl font-semibold tracking-tight">
							{product.title}
						</h1>
						<p className="max-w-2xl text-sm text-muted-foreground">
							{product.description}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
