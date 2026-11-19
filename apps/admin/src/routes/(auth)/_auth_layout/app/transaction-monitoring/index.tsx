import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { useMemo } from "react";
import { useTmAdminTemplatesV2Query } from "#/api/http/v2/transaction-monitoring/transaction-monitoring.hooks";
import { formatAppLabel, formatEventLabel, titleCase } from "./-data";

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/transaction-monitoring/",
)({
	head: () => ({
		meta: [
			{ title: "Transaction Monitoring | VerifyAfrica Admin" },
			{
				name: "description",
				content:
					"The Autogon industry templates tenants can start their transaction monitors from.",
			},
		],
	}),
	component: TransactionMonitoringAdminPage,
});

const TABLE_HEADINGS = [
	"Template",
	"Industry",
	"App",
	"Event",
	"Region",
	"Packs",
	"Rules",
] as const;

function TransactionMonitoringAdminPage() {
	const templatesQuery = useTmAdminTemplatesV2Query();

	const templates = useMemo(
		() => templatesQuery.data?.templates ?? [],
		[templatesQuery.data?.templates],
	);

	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					Transaction Monitoring Templates
				</h1>
				<p className="max-w-3xl text-sm text-muted-foreground">
					These are a hardcoded copy of the industry templates in the Autogon
					Omniguard console, so they can&apos;t be created or edited here. Each
					template&apos;s rules are the combined rules of its packs.
				</p>
			</div>

			<Card>
				<CardContent className="pt-6">
					{templatesQuery.isLoading ? (
						<div className="space-y-3">
							{createSkeletonKeys(6, "tm-admin-template-row").map((key) => (
								<Skeleton key={key} className="h-14 rounded-lg" />
							))}
						</div>
					) : templatesQuery.isError ? (
						<p className="py-12 text-center text-sm text-destructive">
							Unable to load templates.
						</p>
					) : templates.length === 0 ? (
						<p className="py-12 text-center text-sm text-muted-foreground">
							No templates were returned by the API.
						</p>
					) : (
						<div className="overflow-x-auto rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/40 hover:bg-muted/40">
										{TABLE_HEADINGS.map((heading) => (
											<TableHead
												key={heading}
												className="text-xs font-medium tracking-wide uppercase"
											>
												{heading}
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{templates.map((template) => (
										<TableRow key={template.id}>
											<TableCell className="max-w-sm whitespace-normal">
												<p className="font-medium">{template.name}</p>
												<p className="font-mono text-xs text-muted-foreground">
													{template.id}
												</p>
											</TableCell>
											<TableCell>
												{template.industry_label ??
													titleCase(template.industry)}
											</TableCell>
											<TableCell>{formatAppLabel(template.app)}</TableCell>
											<TableCell>{formatEventLabel(template.event)}</TableCell>
											<TableCell>{template.region}</TableCell>
											<TableCell className="whitespace-normal">
												<div className="flex flex-wrap gap-1">
													{(template.packs ?? []).map((pack) => (
														<Badge
															key={pack}
															variant="outline"
															className="font-mono text-xs font-normal"
														>
															{pack}
														</Badge>
													))}
												</div>
											</TableCell>
											<TableCell className="tabular-nums">
												{template.rule_count ?? template.features.length}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
