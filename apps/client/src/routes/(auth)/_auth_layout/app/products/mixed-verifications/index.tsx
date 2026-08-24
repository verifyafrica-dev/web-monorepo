import { ArrowLeftIcon, PlusIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { useTenantMixedVerificationsV2Query } from "#/api/http/v2/verifications/verifications.hooks";
import type {
	MixedVerification,
	VerificationRequest,
} from "#/api/http/v2/verifications/verifications.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { createSkeletonKeys } from "#/lib/skeleton-keys";
import {
	buildLinkResult,
	type HostedLinkResult,
} from "#/lib/verification-links";
import { useCurrentTenant } from "../../team/-data";
import { VerificationResultDialog } from "../-components/verification-result-dialog";
import { getProduct } from "../-data";
import { CustomVerificationDialog } from "./-components/custom-verification-dialog";
import { DeleteCustomVerificationDialog } from "./-components/delete-custom-verification-dialog";
import { MixedVerificationCard } from "./-components/mixed-verification-card";
import { StartMixedVerificationDialog } from "./-components/start-mixed-verification-dialog";
import {
	groupMixedVerifications,
	MIXED_VERIFICATIONS_LIST_PARAMS,
} from "./-data";

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/products/mixed-verifications/",
)({
	head: () => ({
		meta: [
			{ title: "Mixed Verifications | VerifyAfrica" },
			{
				name: "description",
				content: "Combine multiple verification products in one workflow.",
			},
		],
	}),
	component: MixedVerificationsPage,
});

function MixedVerificationSectionCardsSkeleton({
	count = 2,
}: {
	count?: number;
}) {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			{createSkeletonKeys(count, "mixed-verification-card").map((key) => (
				<Skeleton
					key={key}
					className="h-56 w-full rounded-xl"
				/>
			))}
		</div>
	);
}

function MixedVerificationSection({
	title,
	description,
	templates,
	isLoading = false,
	canManageCustom,
	onStart,
	onEdit,
	onDelete,
}: {
	title: string;
	description: string;
	templates: MixedVerification[];
	isLoading?: boolean;
	canManageCustom: boolean;
	onStart: (template: MixedVerification) => void;
	onEdit: (template: MixedVerification) => void;
	onDelete: (template: MixedVerification) => void;
}) {
	return (
		<section className="space-y-4">
			<div className="space-y-1">
				<h2 className="text-lg font-semibold tracking-tight">{title}</h2>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>

			{isLoading ? (
				<MixedVerificationSectionCardsSkeleton />
			) : templates.length === 0 ? (
				<div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
					No templates available in this group yet.
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{templates.map((template) => (
						<MixedVerificationCard
							key={template.id}
							template={template}
							canManageCustom={canManageCustom}
							onStart={onStart}
							onEdit={onEdit}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}
		</section>
	);
}

function MixedVerificationsPage() {
	const product = getProduct("mixed-verifications");
	const { tenantId, isTenantAdmin } = useCurrentTenant();
	const mixedVerificationsQuery = useTenantMixedVerificationsV2Query(
		tenantId,
		MIXED_VERIFICATIONS_LIST_PARAMS,
		Boolean(tenantId),
	);

	const [customDialogOpen, setCustomDialogOpen] = useState(false);
	const [startDialogOpen, setStartDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [editingTemplate, setEditingTemplate] =
		useState<MixedVerification | null>(null);
	const [startingTemplate, setStartingTemplate] =
		useState<MixedVerification | null>(null);
	const [deletingTemplate, setDeletingTemplate] =
		useState<MixedVerification | null>(null);
	const [linkResult, setLinkResult] = useState<HostedLinkResult | null>(null);
	const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

	const groupedTemplates = useMemo(
		() => groupMixedVerifications(mixedVerificationsQuery.data?.items ?? []),
		[mixedVerificationsQuery.data?.items],
	);

	if (!product) {
		return null;
	}

	function openCreateDialog() {
		setEditingTemplate(null);
		setCustomDialogOpen(true);
	}

	function openEditDialog(template: MixedVerification) {
		setEditingTemplate(template);
		setCustomDialogOpen(true);
	}

	function openStartDialog(template: MixedVerification) {
		setStartingTemplate(template);
		setStartDialogOpen(true);
	}

	function openDeleteDialog(template: MixedVerification) {
		setDeletingTemplate(template);
		setDeleteDialogOpen(true);
	}

	function handleMixedVerificationStarted(
		verification: VerificationRequest,
		email: string,
	) {
		setLinkResult(buildLinkResult(verification, email));
		setIsResultDialogOpen(true);
	}

	function handleStartNewMixedVerification() {
		setIsResultDialogOpen(false);
		setLinkResult(null);
	}

	return (
		<div className="flex flex-col gap-6">
			<Button
				variant="ghost"
				className="w-fit px-4"
				asChild
			>
				<Link to="/app/products">
					<ArrowLeftIcon />
					Back to Products
				</Link>
			</Button>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						{product.title}
					</h1>
					<p className="max-w-3xl text-sm text-muted-foreground">
						Start platform mixed verifications or create tenant-specific custom
						bundles from supported verification checks.
					</p>
				</div>

				{isTenantAdmin && tenantId && (
					<Button
						type="button"
						className="cursor-pointer tracking-wide"
						onClick={openCreateDialog}
					>
						<PlusIcon
							className="size-4"
							weight="bold"
						/>
						Create Custom Verification
					</Button>
				)}
			</div>

			{!tenantId ? (
				<div className="rounded-xl border px-6 py-10 text-center text-sm text-muted-foreground">
					Tenant information is unavailable.
				</div>
			) : mixedVerificationsQuery.isError ? (
				<div className="rounded-xl border px-6 py-10 text-center text-sm text-muted-foreground">
					Failed to load mixed verifications. Please try again.
				</div>
			) : (
				<div className="space-y-10">
					<MixedVerificationSection
						title="Platform Mixed Verifications"
						description="Predefined verification journeys provided by VerifyAfrica."
						templates={groupedTemplates.platform}
						isLoading={mixedVerificationsQuery.isPending}
						canManageCustom={isTenantAdmin}
						onStart={openStartDialog}
						onEdit={openEditDialog}
						onDelete={openDeleteDialog}
					/>

					<MixedVerificationSection
						title="Your Custom Verifications"
						description={
							isTenantAdmin
								? "Templates created for your tenant."
								: "Custom templates available to your tenant."
						}
						templates={groupedTemplates.custom}
						isLoading={mixedVerificationsQuery.isPending}
						canManageCustom={isTenantAdmin}
						onStart={openStartDialog}
						onEdit={openEditDialog}
						onDelete={openDeleteDialog}
					/>
				</div>
			)}

			{tenantId && (
				<>
					<CustomVerificationDialog
						open={customDialogOpen}
						onOpenChange={setCustomDialogOpen}
						tenantId={tenantId}
						template={editingTemplate}
					/>
					<StartMixedVerificationDialog
						open={startDialogOpen}
						onOpenChange={setStartDialogOpen}
						template={startingTemplate}
						tenantId={tenantId}
						onStarted={handleMixedVerificationStarted}
					/>
					<VerificationResultDialog
						open={isResultDialogOpen}
						onOpenChange={setIsResultDialogOpen}
						linkResult={linkResult}
						verification={null}
						onStartNew={handleStartNewMixedVerification}
						description="Your mixed verification request was created successfully."
					/>
					<DeleteCustomVerificationDialog
						open={deleteDialogOpen}
						template={deletingTemplate}
						onOpenChange={setDeleteDialogOpen}
					/>
				</>
			)}
		</div>
	);
}
