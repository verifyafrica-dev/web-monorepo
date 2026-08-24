import {
	PencilSimpleIcon,
	PlusIcon,
	PowerIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getV2ErrorMessage } from "#/api/http/shared";
import {
	useAllMixedVerificationsV2Query,
	useUpdateMixedVerificationV2Mutation,
} from "#/api/http/v2/verifications/verifications.hooks";
import type { MixedVerification } from "#/api/http/v2/verifications/verifications.types";
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
import { cn } from "#/lib/utils.ts";
import { createSkeletonKeys } from "#/lib/skeleton-keys";
import { DeleteMixedVerificationDialog } from "./-components/delete-mixed-verification-dialog";
import { MixedVerificationFormDialog } from "./-components/mixed-verification-form-dialog";
import {
	formatMixedVerificationPrice,
	formatMixedVerificationType,
	getMixedVerificationStatusBadgeClass,
} from "./-data";

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/mixed-verifications/",
)({
	head: () => ({
		meta: [
			{ title: "Mixed Verifications | VerifyAfrica" },
			{ name: "description", content: "Track and manage mixed verification requests across tenants." },
		],
	}),
	component: MixedVerificationsPage,
});

function MixedVerificationsPage() {
	const [formOpen, setFormOpen] = useState(false);
	const [editingTemplate, setEditingTemplate] =
		useState<MixedVerification | null>(null);
	const [templateToDelete, setTemplateToDelete] =
		useState<MixedVerification | null>(null);

	const templatesQuery = useAllMixedVerificationsV2Query({
		per_page: 500,
		is_custom: false,
	});
	const updateTemplateMutation = useUpdateMixedVerificationV2Mutation();

	const templates = useMemo(
		() => templatesQuery.data?.items ?? [],
		[templatesQuery.data?.items],
	);

	const handleOpenCreate = () => {
		setEditingTemplate(null);
		setFormOpen(true);
	};

	const handleOpenEdit = (template: MixedVerification) => {
		setEditingTemplate(template);
		setFormOpen(true);
	};

	const handleToggleActive = async (template: MixedVerification) => {
		try {
			await updateTemplateMutation.mutateAsync({
				id: template.id,
				payload: { is_active: !template.is_active },
			});
			toast.success(
				template.is_active
					? "Mixed verification disabled"
					: "Mixed verification enabled",
			);
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Mixed Verification Templates
					</h1>
					<p className="text-sm text-muted-foreground">
						Manage hosted verification journeys that combine multiple
						verification checks.
					</p>
				</div>
				<Button onClick={handleOpenCreate}>
					<PlusIcon weight="bold" />
					Add Mixed Verification
				</Button>
			</div>

			<Card>
				<CardContent className="pt-6">
					{templatesQuery.isLoading ? (
						<div className="space-y-3">
							{createSkeletonKeys(5, "mixed-verification-row").map((key) => (
								<Skeleton
									key={key}
									className="h-16 rounded-lg"
								/>
							))}
						</div>
					) : templatesQuery.isError ? (
						<p className="py-12 text-center text-sm text-destructive">
							Unable to load mixed verification templates.
						</p>
					) : templates.length === 0 ? (
						<p className="py-12 text-center text-sm text-muted-foreground">
							No mixed verification templates have been created yet.
						</p>
					) : (
						<div className="overflow-x-auto rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/40 hover:bg-muted/40">
										<TableHead className="text-xs font-medium tracking-wide uppercase">
											Name
										</TableHead>
										<TableHead className="text-xs font-medium tracking-wide uppercase">
											Included Verifications
										</TableHead>
										<TableHead className="text-xs font-medium tracking-wide uppercase">
											Journey ID
										</TableHead>
										<TableHead className="text-xs font-medium tracking-wide uppercase">
											Price
										</TableHead>
										<TableHead className="text-xs font-medium tracking-wide uppercase">
											Status
										</TableHead>
										<TableHead className="text-right text-xs font-medium tracking-wide uppercase">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{templates.map((template) => (
										<TableRow key={template.id}>
											<TableCell className="max-w-sm whitespace-normal">
												<p className="font-medium">{template.name}</p>
												{template.description ? (
													<Tooltip>
														<TooltipTrigger asChild>
															<p className="mt-1 line-clamp-2 cursor-default text-sm text-muted-foreground">
																{template.description}
															</p>
														</TooltipTrigger>
														<TooltipContent
															side="top"
															sideOffset={6}
															className="max-w-sm text-left whitespace-normal"
														>
															{template.description}
														</TooltipContent>
													</Tooltip>
												) : (
													<p className="mt-1 text-sm text-muted-foreground">
														No description provided.
													</p>
												)}
											</TableCell>
											<TableCell>
												<div className="flex max-w-md flex-wrap gap-1.5">
													{template.verifications.map((verificationType) => (
														<Badge
															key={verificationType}
															className="font-normal"
														>
															{formatMixedVerificationType(verificationType)}
														</Badge>
													))}
												</div>
											</TableCell>
											<TableCell className="whitespace-nowrap font-mono text-sm">
												{template.journey_id || "—"}
											</TableCell>
											<TableCell className="whitespace-nowrap tabular-nums">
												{formatMixedVerificationPrice(template.price)}
											</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className={cn(
														getMixedVerificationStatusBadgeClass(
															template.is_active,
														),
													)}
												>
													{template.is_active ? "Active" : "Disabled"}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-1">
													<Tooltip>
														<TooltipTrigger asChild>
															<span className="inline-flex">
																<Button
																	variant="ghost"
																	size="icon-sm"
																	onClick={() => handleOpenEdit(template)}
																>
																	<PencilSimpleIcon className="size-4" />
																</Button>
															</span>
														</TooltipTrigger>
														<TooltipContent side="top">
															Edit template
														</TooltipContent>
													</Tooltip>
													<Tooltip>
														<TooltipTrigger asChild>
															<span className="inline-flex">
																<Button
																	variant="ghost"
																	size="icon-sm"
																	onClick={() =>
																		void handleToggleActive(template)
																	}
																	disabled={updateTemplateMutation.isPending}
																>
																	<PowerIcon className="size-4" />
																</Button>
															</span>
														</TooltipTrigger>
														<TooltipContent side="top">
															{template.is_active
																? "Disable template"
																: "Enable template"}
														</TooltipContent>
													</Tooltip>
													<Tooltip>
														<TooltipTrigger asChild>
															<span className="inline-flex">
																<Button
																	variant="ghost"
																	size="icon-sm"
																	className="text-destructive hover:text-destructive"
																	onClick={() => setTemplateToDelete(template)}
																>
																	<TrashIcon className="size-4" />
																</Button>
															</span>
														</TooltipTrigger>
														<TooltipContent side="top">
															Delete template
														</TooltipContent>
													</Tooltip>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<MixedVerificationFormDialog
				open={formOpen}
				template={editingTemplate}
				onOpenChange={(nextOpen) => {
					setFormOpen(nextOpen);
				}}
			/>

			<DeleteMixedVerificationDialog
				open={Boolean(templateToDelete)}
				template={templateToDelete}
				onOpenChange={(nextOpen) => {
					if (!nextOpen) {
						setTemplateToDelete(null);
					}
				}}
				onSuccess={() => {
					setTemplateToDelete(null);
				}}
			/>
		</div>
	);
}
