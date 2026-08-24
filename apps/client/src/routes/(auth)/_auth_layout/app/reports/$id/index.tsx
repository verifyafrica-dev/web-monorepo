import {
	ArrowLeftIcon,
	ArrowsClockwiseIcon,
	DownloadSimpleIcon,
} from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { toast } from "sonner";

import {
	useRefreshVerificationStatusV2Mutation,
	useVerificationRequestDetailV2Query,
} from "#/api/http/v2/verifications/verifications.hooks";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { useBrandedPdfDownload } from "#/hooks/use-branded-pdf-download";
import { createSkeletonKeys } from "#/lib/skeleton-keys";
import { cn } from "#/lib/utils.ts";
import {
	type VerificationRequestDetail,
	VERIFICATION_TYPES_BY_PRODUCT,
	isAmlScreeningVerificationDetail,
	type AmlScreeningVerificationRequestDetail,
	type DocumentVerificationRequestDetail,
	type GovernmentRegistryChecksVerificationRequestDetail,
} from "#/api/http/v2/verifications/verifications.types";
import { AmlScreeningReport } from "../-components/aml-screening/aml-screening-report";
import { AddressVerificationReport } from "../-components/address-verification-report";
import { BusinessAmlScreeningReport } from "../-components/business-aml-screening-report";
import { CryptoWalletScreeningReport } from "../-components/crypto-wallet-screening-report";
import { DocumentVerificationReport } from "../-components/document-verification/document-verification-report";
import { FacialScreeningReport } from "../-components/facial-screening-report";
import { GovernmentRegistryChecksReport } from "../-components/government-registry-checks-report";
import { KybReport } from "../-components/kyb-report";
import { RiskAssessmentReport } from "../-components/risk-assessment-report";
import { VerificationMetadataCard } from "../-components/verification-metadata-card";
import { VerificationProofsSection } from "../-components/verification-proofs/verification-proofs-section";
import { GenericVerificationDetailReport } from "../-components/generic-verification-detail-report";
import { VerificationStatusSchema } from "#/api/http/v1/verifications/verifications.types";

export const Route = createFileRoute("/(auth)/_auth_layout/app/reports/$id/")({
	head: () => ({
		meta: [
			{ title: "Report Details | VerifyAfrica" },
			{
				name: "description",
				content: "Review full details and outcomes for a specific report.",
			},
		],
	}),
	component: VerificationReportDetailPage,
});

function VerificationReportDetailPage() {
	const { id } = Route.useParams();
	const reportRef = useRef<HTMLDivElement>(null);
	const amlDownloadRef = useRef<HTMLDivElement>(null);
	const standardDownload = useBrandedPdfDownload(reportRef);
	const amlDownload = useBrandedPdfDownload(amlDownloadRef);

	const verificationQuery = useVerificationRequestDetailV2Query(
		id,
		Boolean(id),
	);
	const refreshMutation = useRefreshVerificationStatusV2Mutation();
	const verification = verificationQuery.data;
	const amlVerification =
		verification && isAmlScreeningVerificationDetail(verification)
			? verification
			: null;
	const isAmlScreening = Boolean(amlVerification);
	const isDownloading = isAmlScreening
		? amlDownload.isDownloading
		: standardDownload.isDownloading;

	const isRefreshEligible = useMemo(() => {
		return verification?.status === VerificationStatusSchema.enum.PENDING;
	}, [verification]);
	const isInProductGroup = (
		group: readonly string[],
		verificationType: string,
	) => group.includes(verificationType);

	function renderVerificationDetail(
		verificationData: VerificationRequestDetail,
	) {
		const verificationType = verificationData.verification_type;

		switch (true) {
			case isInProductGroup(
				VERIFICATION_TYPES_BY_PRODUCT["AML Screening"],
				verificationType,
			): {
				return (
					<AmlScreeningReport
						verification={
							verificationData as AmlScreeningVerificationRequestDetail
						}
						downloadRef={amlDownloadRef}
					/>
				);
			}
			case isInProductGroup(
				VERIFICATION_TYPES_BY_PRODUCT["Business AML Screening"],
				verificationType,
			): {
				return <BusinessAmlScreeningReport verification={verificationData} />;
			}
			case isInProductGroup(
				VERIFICATION_TYPES_BY_PRODUCT["Crypto Wallet Screening"],
				verificationType,
			): {
				return <CryptoWalletScreeningReport verification={verificationData} />;
			}
			case isInProductGroup(
				VERIFICATION_TYPES_BY_PRODUCT["Document Verification"],
				verificationType,
			):
			case verificationType === "document_verification":
				return (
					<DocumentVerificationReport
						verification={verificationData as DocumentVerificationRequestDetail}
					/>
				);
			case isInProductGroup(
				VERIFICATION_TYPES_BY_PRODUCT["Address Verification"],
				verificationType,
			):
				return <AddressVerificationReport verification={verificationData} />;
			case isInProductGroup(
				VERIFICATION_TYPES_BY_PRODUCT["Facial Screening"],
				verificationType,
			):
			case verificationType === "facial_screening":
				return <FacialScreeningReport verification={verificationData} />;
			case isInProductGroup(
				VERIFICATION_TYPES_BY_PRODUCT["KYB Screening"],
				verificationType,
			):
			case verificationType === "kyb":
				return <KybReport verification={verificationData} />;
			case isInProductGroup(
				VERIFICATION_TYPES_BY_PRODUCT["Government Registry Checks"],
				verificationType,
			):
			case verificationType === "government_registry_checks":
			case verificationType === "government-registry-checks":
				return (
					<GovernmentRegistryChecksReport
						verification={
							verificationData as GovernmentRegistryChecksVerificationRequestDetail
						}
					/>
				);
			case isInProductGroup(
				VERIFICATION_TYPES_BY_PRODUCT["Risk Assessment"],
				verificationType,
			):
			case verificationType === "risk-assessment":
				return <RiskAssessmentReport verification={verificationData} />;
			default:
				return (
					<GenericVerificationDetailReport verification={verificationData} />
				);
		}
	}

	async function handleRefresh() {
		if (!verification) {
			return;
		}

		try {
			await refreshMutation.mutateAsync(verification.id);
			toast.success("Verification data refreshed.");
		} catch {
			toast.error("Failed to refresh verification data.");
		}
	}

	async function handleDownloadPdf() {
		if (!verification) {
			return;
		}

		const downloader = isAmlScreening
			? amlDownload.downloadPdf
			: standardDownload.downloadPdf;
		await downloader({ filename: `verification-${verification.id}.pdf` });
	}

	return (
		<div className="flex min-w-0 flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-3">
					<Button
						variant="ghost"
						className="w-fit px-4"
						asChild
					>
						<Link to="/app/reports">
							<ArrowLeftIcon />
							Back to Reports
						</Link>
					</Button>
					<div className="space-y-1">
						<h1 className="text-2xl font-semibold tracking-tight">
							Verification Report
						</h1>
						<p className="text-sm text-muted-foreground">
							Review the complete verification outcome and downloadable report.
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{verification && isRefreshEligible ? (
						<Button
							type="button"
							variant="outline"
							className="cursor-pointer tracking-wide"
							disabled={refreshMutation.isPending}
							onClick={() => void handleRefresh()}
						>
							<ArrowsClockwiseIcon
								className={cn(refreshMutation.isPending && "animate-spin")}
								weight="bold"
							/>
							{refreshMutation.isPending ? "Refreshing..." : "Refresh"}
						</Button>
					) : null}
					<Button
						type="button"
						variant="outline"
						className="cursor-pointer tracking-wide"
						disabled={!verification || isDownloading}
						onClick={() => void handleDownloadPdf()}
					>
						<DownloadSimpleIcon weight="bold" />
						{isDownloading ? "Downloading..." : "Download PDF"}
					</Button>
				</div>
			</div>

			{verificationQuery.isPending || refreshMutation.isPending ? (
				<div className="flex flex-col gap-6">
					<Card>
						<CardContent className="space-y-4 pt-6">
							<Skeleton className="h-6 w-48" />
							<div className="grid gap-4 sm:grid-cols-2">
								{createSkeletonKeys(6, "report-metadata-field").map((key) => (
									<Skeleton
										key={key}
										className="h-14 w-full"
									/>
								))}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="space-y-4 pt-6">
							<Skeleton className="h-5 w-40" />
							<Skeleton className="h-64 w-full" />
						</CardContent>
					</Card>
					<Card>
						<CardContent className="space-y-4 pt-6">
							<Skeleton className="h-5 w-24" />
							<div className="grid gap-4 sm:grid-cols-2">
								{createSkeletonKeys(2, "report-proof-field").map((key) => (
									<div
										key={key}
										className="flex flex-col gap-2 sm:col-span-2"
									>
										<Skeleton className="h-3 w-32" />
										<Skeleton className="h-40 w-full max-w-xs rounded-md" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			) : verificationQuery.isError || !verification ? (
				<Card>
					<CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 pt-6 text-center">
						<p className="text-sm text-muted-foreground">
							Failed to load verification report. It may not exist or you may
							not have access.
						</p>
						<Button
							type="button"
							variant="outline"
							className="cursor-pointer"
							onClick={() => void verificationQuery.refetch()}
						>
							Try Again
						</Button>
					</CardContent>
				</Card>
			) : (
				<div
					ref={reportRef}
					className="flex flex-col gap-6"
				>
					<VerificationMetadataCard verification={verification} />
					{renderVerificationDetail(verification)}
					{verification.proofs_available ? (
						<VerificationProofsSection proofs={verification.proofs} />
					) : null}
				</div>
			)}
		</div>
	);
}
