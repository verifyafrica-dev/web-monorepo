import { PencilSimpleIcon, PlusIcon, PowerIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import type { TmTemplate } from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
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
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@verifyafrica/ui/components/ui/tooltip";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { cn } from "@verifyafrica/ui/lib/utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	useTmAdminFeaturesV2Query,
	useTmAdminTemplatesV2Query,
	useUpdateTmPlatformTemplateV2Mutation,
} from "#/api/http/v2/transaction-monitoring/transaction-monitoring.hooks";
import { TemplateFormDialog } from "./-components/template-form-dialog";
import { formatEventLabel } from "./-data";

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/transaction-monitoring/",
)({
	head: () => ({
		meta: [
			{ title: "Transaction Monitoring | VerifyAfrica Admin" },
			{
				name: "description",
				content:
					"Manage the platform templates tenants can start their transaction monitors from.",
			},
		],
	}),
	component: TransactionMonitoringAdminPage,
});

function TransactionMonitoringAdminPage() {
	const templatesQuery = useTmAdminTemplatesV2Query();
	const featuresQuery = useTmAdminFeaturesV2Query();
	const updateMutation = useUpdateTmPlatformTemplateV2Mutation();
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<TmTemplate | null>(null);

	const templates = useMemo(
		() => templatesQuery.data?.templates ?? [],
		[templatesQuery.data?.templates],
	);
	const catalog = useMemo(
		() => featuresQuery.data?.features ?? [],
		[featuresQuery.data?.features],
	);

	function openCreate() {
		setEditing(null);
		setFormOpen(true);
	}

	function openEdit(template: TmTemplate) {
		setEditing(template);
		setFormOpen(true);
	}

	function handleToggleActive(template: TmTemplate) {
		const nextActive = !(template.is_active ?? true);
		updateMutation.mutate(
			{ templateId: template.id, payload: { is_active: nextActive } },
			{
				onSuccess: () =>
					toast.success(nextActive ? "Template enabled" : "Template disabled"),
				onError: (error) => toast.error(getV2ErrorMessage(error)),
			},
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Transaction Monitoring Templates
					</h1>
					<p className="text-sm text-muted-foreground">
						Starter packs tenants can use when creating a monitor. Disabled
						templates are hidden from tenants.
					</p>
				</div>
				<Button onClick={openCreate}>
					<PlusIcon weight="bold" />
					Add Template
				</Button>
			</div>

			<Card>
				<CardContent className="pt-6">
					{templatesQuery.isLoading ? (
						<div className="space-y-3">
							{createSkeletonKeys(5, "tm-admin-template-row").map((key) => (
								<Skeleton key={key} className="h-16 rounded-lg" />
							))}
						</div>
					) : templatesQuery.isError ? (
						<p className="py-12 text-center text-sm text-destructive">
							Unable to load templates.
						</p>
					) : templates.length === 0 ? (
						<p className="py-12 text-center text-sm text-muted-foreground">
							No templates yet. Add one, or run the{" "}
							<code>seed_tm_templates</code> command to load the built-in set.
						</p>
					) : (
						<div className="overflow-x-auto rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/40 hover:bg-muted/40">
										{[
											"Name",
											"Event",
											"Region",
											"Features",
											"Order",
											"Status",
											"Actions",
										].map((heading) => (
											<TableHead
												key={heading}
												className={cn(
													"text-xs font-medium tracking-wide uppercase",
													heading === "Actions" && "text-right",
												)}
											>
												{heading}
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{templates.map((template) => {
										const isActive = template.is_active ?? true;
										return (
											<TableRow key={template.id}>
												<TableCell className="max-w-sm whitespace-normal">
													<p className="font-medium">{template.name}</p>
													<p className="font-mono text-xs text-muted-foreground">
														{template.id}
													</p>
												</TableCell>
												<TableCell>
													{formatEventLabel(template.event)}
												</TableCell>
												<TableCell>{template.region}</TableCell>
												<TableCell className="tabular-nums">
													{template.features.length}
												</TableCell>
												<TableCell className="tabular-nums">
													{template.sort_order ?? 0}
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={cn(
															isActive
																? "border-emerald-200 bg-emerald-50 text-emerald-700"
																: "border-border bg-muted text-muted-foreground",
														)}
													>
														{isActive ? "Active" : "Disabled"}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-1">
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	aria-label={`Edit ${template.name}`}
																	onClick={() => openEdit(template)}
																>
																	<PencilSimpleIcon className="size-4" />
																</Button>
															</TooltipTrigger>
															<TooltipContent side="top">
																Edit template
															</TooltipContent>
														</Tooltip>
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	aria-label={
																		isActive
																			? `Disable ${template.name}`
																			: `Enable ${template.name}`
																	}
																	disabled={updateMutation.isPending}
																	onClick={() => handleToggleActive(template)}
																>
																	<PowerIcon className="size-4" />
																</Button>
															</TooltipTrigger>
															<TooltipContent side="top">
																{isActive
																	? "Disable template"
																	: "Enable template"}
															</TooltipContent>
														</Tooltip>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<TemplateFormDialog
				open={formOpen}
				template={editing}
				catalog={catalog}
				catalogLoading={featuresQuery.isLoading}
				catalogError={featuresQuery.isError}
				onOpenChange={setFormOpen}
			/>
		</div>
	);
}
