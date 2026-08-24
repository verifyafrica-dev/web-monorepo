import {
	ArrowLeftIcon,
	CheckCircleIcon,
	FileTextIcon,
	InfoIcon,
} from "@phosphor-icons/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useKycTenantQuery } from "#/api/http/v1/kyc/kyc.hooks";
import { normalizeComplianceData } from "#/api/http/v1/kyc/kyc.types";
import type { TenantDetail } from "#/api/http/v2/tenants/tenants.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { cn } from "@verifyafrica/ui/lib/utils";
import { KycProvider, useKycTenantId } from "./-components/kyc-provider";
import { KycSectionContent } from "./-components/kyc-section-content";
import { KycSectionList } from "./-components/kyc-section-list";
import {
	KycRejectedAlert,
	KycSubmitPanel,
} from "./-components/kyc-submit-panel";
import {
	getSectionByPath,
	KYC_SECTION_PATHS,
	type KycSectionPath,
	sections,
} from "./-data";
import { getKycCompletionStatus, getKycDisplayStatus } from "./-utils";

const kycSearchSchema = z.object({
	section: z.enum(KYC_SECTION_PATHS).optional(),
});

export const Route = createFileRoute("/(auth)/_auth_layout/app/kyc/")({
	head: () => ({
		meta: [
			{ title: "KYC | VerifyAfrica" },
			{
				name: "description",
				content: "Submit and track Know Your Customer verification checks.",
			},
		],
	}),
	validateSearch: kycSearchSchema,
	component: KycPage,
});

const STATUS_BADGE = {
	pending: {
		label: "Not Started",
		className: "border-slate-200 bg-slate-50 text-slate-600",
		icon: InfoIcon,
	},
	submitted: {
		label: "Under Review",
		className: "border-amber-200 bg-amber-50 text-amber-800",
		icon: FileTextIcon,
	},
	approved: {
		label: "Approved",
		className: "border-emerald-200 bg-emerald-50 text-emerald-700",
		icon: CheckCircleIcon,
	},
	rejected: {
		label: "Rejected",
		className: "border-red-200 bg-red-50 text-red-800",
		icon: InfoIcon,
	},
} as const;

function KycPageSkeleton() {
	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
			<Skeleton className="h-8 w-48" />
			<Skeleton className="h-4 w-full max-w-xl" />
			<div className="space-y-3">
				{sections.slice(0, 4).map((section) => (
					<Skeleton
						key={section.path}
						className="h-24 w-full"
					/>
				))}
			</div>
		</div>
	);
}

function KycStatusBadge({ status }: { status: keyof typeof STATUS_BADGE }) {
	const config = STATUS_BADGE[status];
	const Icon = config.icon;

	return (
		<Badge
			variant="outline"
			className={cn("gap-1.5 px-3 py-1", config.className)}
		>
			<Icon
				className="size-3.5"
				weight="fill"
			/>
			{config.label}
		</Badge>
	);
}

function KycPageInner({
	activeSection,
	tenant,
}: {
	activeSection?: (typeof sections)[number];
	tenant: TenantDetail;
}) {
	const kycData = normalizeComplianceData(tenant.compliance_data);
	const status = getKycDisplayStatus({
		kyc_verified: tenant.kyc.kyc_verified,
		kyc_status: tenant.kyc.kyc_status,
	});

	const overallProgress = Object.values(getKycCompletionStatus(kycData)).filter(
		Boolean,
	).length;

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
			<KycRejectedAlert
				show={status === "rejected"}
				rejected_at={tenant.kyc.kyc_rejected_at}
				general_rejected_reason={tenant.general_rejected_reason}
				section_rejected_reason={tenant.section_rejected_reason}
			/>

			{activeSection ? (
				<div className="flex flex-col gap-6">
					<Button
						variant="outline"
						size="sm"
						className="w-fit cursor-pointer tracking-wide"
						asChild
					>
						<Link to="/app/kyc">
							<ArrowLeftIcon
								className="size-4"
								weight="bold"
							/>
							Back to KYC
						</Link>
					</Button>
					<KycSectionContent section={activeSection} />
				</div>
			) : (
				<>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<h1 className="text-2xl font-semibold tracking-tight">
								KYC Verification
							</h1>
							<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
								Complete your Know Your Customer verification to unlock all
								features
							</p>
							<p className="mt-2 text-xs text-muted-foreground">
								{overallProgress} of {sections.length} sections completed
							</p>
						</div>
						<KycStatusBadge status={status} />
					</div>

					<KycSectionList sections={sections} />
					<KycSubmitPanel />
				</>
			)}
		</div>
	);
}

function KycPage() {
	const tenantId = useKycTenantId();
	const navigate = useNavigate();
	const { section: activeSectionPath } = Route.useSearch();
	const activeSection = getSectionByPath(activeSectionPath);
	const kycQuery = useKycTenantQuery(tenantId, Boolean(tenantId));

	function navigateToSection(path: KycSectionPath | null) {
		void navigate({
			to: "/app/kyc",
			search: path ? { section: path } : {},
		});
	}

	if (!tenantId) {
		return (
			<div className="mx-auto max-w-4xl rounded-lg border px-6 py-10 text-center text-sm text-muted-foreground">
				Tenant information is unavailable.
			</div>
		);
	}

	if (kycQuery.isPending) {
		return <KycPageSkeleton />;
	}

	if (kycQuery.isError || !kycQuery.data) {
		return (
			<div className="mx-auto max-w-4xl rounded-lg border px-6 py-10 text-center text-sm text-muted-foreground">
				Failed to load KYC information. Please try again.
			</div>
		);
	}

	const tenant = kycQuery.data;

	return (
		<KycProvider
			tenantId={tenantId}
			tenant={tenant}
			onNavigateToSection={navigateToSection}
		>
			<KycPageInner
				activeSection={activeSection}
				tenant={tenant}
			/>
		</KycProvider>
	);
}
