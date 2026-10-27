import { ArrowLeftIcon, PlusIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import {
	useMixedVerificationsAvailabilityV2Query,
	useTenantMixedVerificationsV2Query,
	VERIFICATIONS_V2_QUERY_KEYS,
} from "#/api/http/v2/verifications/verifications.hooks";
import type {
	MixedVerification,
	MixedVerificationAvailabilityCatalog,
	MixedVerificationSession,
	PaginatedMixedVerificationListResult,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import {
	buildMixedSessionLinkResult,
	type HostedLinkResult,
} from "@verifyafrica/api-client/lib/verification-links";
import { useCurrentTenant } from "../../team/-data";
import { VerificationResultDialog } from "../-components/verification-result-dialog";
import { getProduct } from "../-data";
import { CustomVerificationDialog } from "./-components/custom-verification-dialog";
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
	availabilityCatalog,
	onStart,
	onEdit,
}: {
	title: string;
	description: string;
	templates: MixedVerification[];
	isLoading?: boolean;
	canManageCustom: boolean;
	availabilityCatalog?: MixedVerificationAvailabilityCatalog | null;
	onStart: (template: MixedVerification) => void;
	onEdit: (template: MixedVerification) => void;
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
							availabilityCatalog={availabilityCatalog}
							onStart={onStart}
							onEdit={onEdit}
						/>
					))}
				</div>
			)}
		</section>
	);
}

function MixedVerificationsPage() {
	const queryClient = useQueryClient();
	const product = getProduct("mixed-verifications");
	const { tenantId, isTenantAdmin } = useCurrentTenant();
	const mixedVerificationsQuery = useTenantMixedVerificationsV2Query(
		tenantId,
		MIXED_VERIFICATIONS_LIST_PARAMS,
		Boolean(tenantId),
	);
	const availabilityQuery = useMixedVerificationsAvailabilityV2Query(
		tenantId,
		Boolean(tenantId),
	);

	const [customDialogOpen, setCustomDialogOpen] = useState(false);
	const [startDialogOpen, setStartDialogOpen] = useState(false);
	const [editingTemplate, setEditingTemplate] =
		useState<MixedVerification | null>(null);
	const [startingTemplate, setStartingTemplate] =
		useState<MixedVerification | null>(null);
	const [linkResult, setLinkResult] = useState<HostedLinkResult | null>(null);
	const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

	const groupedTemplates = useMemo(
		() => groupMixedVerifications(mixedVerificationsQuery.data?.items ?? []),
		[mixedVerificationsQuery.data?.items],
	);

	async function refreshAvailabilityForForm(
		template?: MixedVerification | null,
	) {
		if (!tenantId) {
			return;
		}

		await Promise.all([
			queryClient.invalidateQueries({
				queryKey:
					VERIFICATIONS_V2_QUERY_KEYS.mixedVerificationsAvailability(tenantId),
			}),
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.tenantMixedVerifications(
					tenantId,
					MIXED_VERIFICATIONS_LIST_PARAMS,
				),
			}),
		]);

		if (!template) {
			return;
		}

		const freshList =
			queryClient.getQueryData<PaginatedMixedVerificationListResult>(
				VERIFICATIONS_V2_QUERY_KEYS.tenantMixedVerifications(
					tenantId,
					MIXED_VERIFICATIONS_LIST_PARAMS,
				),
			);
		const freshTemplate = freshList?.items.find(
			(item) => item.id === template.id,
		);
		if (freshTemplate) {
			setEditingTemplate(freshTemplate);
			setStartingTemplate((current) =>
				current?.id === freshTemplate.id ? freshTemplate : current,
			);
		}
	}

	if (!product) {
		return null;
	}

	function openCreateDialog() {
		setEditingTemplate(null);
		setCustomDialogOpen(true);
		void refreshAvailabilityForForm(null);
	}

	function openEditDialog(template: MixedVerification) {
		setEditingTemplate(template);
		setCustomDialogOpen(true);
		void refreshAvailabilityForForm(template);
	}

	function openStartDialog(template: MixedVerification) {
		setStartingTemplate(template);
		setStartDialogOpen(true);
		void refreshAvailabilityForForm(template);
	}

	function handleMixedVerificationStarted(
		session: MixedVerificationSession,
		email: string,
	) {
		setLinkResult(buildMixedSessionLinkResult(session, email));
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
						availabilityCatalog={availabilityQuery.data}
						onStart={openStartDialog}
						onEdit={openEditDialog}
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
						availabilityCatalog={availabilityQuery.data}
						onStart={openStartDialog}
						onEdit={openEditDialog}
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
						availabilityCatalog={availabilityQuery.data}
					/>
					<StartMixedVerificationDialog
						open={startDialogOpen}
						onOpenChange={setStartDialogOpen}
						template={startingTemplate}
						tenantId={tenantId}
						availabilityCatalog={availabilityQuery.data}
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
				</>
			)}
		</div>
	);
}
