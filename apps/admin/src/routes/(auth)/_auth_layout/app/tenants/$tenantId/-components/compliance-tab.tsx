import {
	BuildingsIcon,
	CheckCircleIcon,
	ClipboardTextIcon,
	FileTextIcon,
	ShieldCheckIcon,
	UsersIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getV2ErrorMessage } from "#/api/http/shared";
import { useUpdateTenantV2Mutation } from "#/api/http/v2/tenants/tenants.hooks";
import type { TenantDetail } from "#/api/http/v2/tenants/tenants.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@verifyafrica/ui/components/ui/tabs";
import {
	COMPLIANCE_DECLARATION_ITEMS,
	getAuthorizedSignature,
	getComplianceDeclarationValue,
	getComplianceDirectors,
	getComplianceFieldValue,
	getComplianceUbos,
	hasComplianceDeclarations,
} from "../-data";
import {
	COMPLIANCE_SUB_TABS,
	type ComplianceSubTab,
} from "../-constants";
import { ComplianceDocumentsSection } from "./compliance-documents-section";
import {
	RejectComplianceDialog,
	type RejectComplianceSubmitPayload,
} from "./reject-compliance-dialog";

function getCompliancePersonKey(
	person: Record<string, unknown>,
	role: "director" | "ubo",
): string {
	return [
		role,
		getComplianceFieldValue(person, "name"),
		getComplianceFieldValue(person, "id_number"),
		getComplianceFieldValue(person, "date_of_birth"),
	].join("|");
}

function getComplianceReviewState(tenant?: TenantDetail) {
	const kyc = tenant?.kyc;

	if (kyc?.kyc_verified || kyc?.kyc_status === "verified") {
		return {
			label: "Approved",
			description: "Compliance is currently approved for this tenant.",
			badgeClassName:
				"border-emerald-200 bg-emerald-50 text-emerald-700",
			canApprove: false,
			canReject: true,
			rejectLabel: "Revoke Approval",
		};
	}

	if (kyc?.kyc_status === "rejected") {
		return {
			label: "Rejected",
			description: tenant?.general_rejected_reason
				? "This application was rejected."
				: "Compliance approval has been revoked.",
			badgeClassName: "border-red-200 bg-red-50 text-red-700",
			canApprove: true,
			canReject: true,
			rejectLabel: "Update Rejection",
		};
	}

	if (kyc?.kyc_status === "submitted") {
		return {
			label: "Pending",
			description: "Submitted and awaiting admin review.",
			badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
			canApprove: true,
			canReject: true,
			rejectLabel: "Reject",
		};
	}

	return {
		label: "Draft",
		description: "Not yet submitted",
		badgeClassName: "border-muted bg-muted text-muted-foreground",
		canApprove: true,
		canReject: true,
		rejectLabel: "Reject",
	};
}

export function ComplianceTab({
	tenant,
	tenantId,
	activeSubTab,
	onSubTabChange,
	onUpdated,
}: {
	tenant?: TenantDetail;
	tenantId: string;
	activeSubTab: ComplianceSubTab;
	onSubTabChange: (subTab: ComplianceSubTab) => void;
	onUpdated?: () => void;
}) {
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

	const updateTenantMutation = useUpdateTenantV2Mutation(tenantId);
	const reviewState = useMemo(() => getComplianceReviewState(tenant), [tenant]);
	const isApproved = reviewState.label === "Approved";
	const isSaving = updateTenantMutation.isPending;

	useEffect(() => {
		if (isApproved && activeSubTab === COMPLIANCE_SUB_TABS.REVIEW) {
			onSubTabChange(COMPLIANCE_SUB_TABS.COMPANY_OVERVIEW);
		}
	}, [activeSubTab, isApproved, onSubTabChange]);

	const complianceData = (tenant?.compliance_data ?? {}) as Record<
		string,
		Record<string, unknown>
	>;
	const directors = getComplianceDirectors(complianceData);
	const ubos = getComplianceUbos(complianceData);
	const authorizedSignature = getAuthorizedSignature(complianceData);

	const handleApprove = async () => {
		try {
			await updateTenantMutation.mutateAsync({
				kyc_verified: true,
				general_rejected_reason: "",
				reject_reason: "",
			});
			toast.success("Compliance approved successfully");
			onUpdated?.();
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	const handleReject = async (payload: RejectComplianceSubmitPayload) => {
		try {
			await updateTenantMutation.mutateAsync({
				kyc_verified: false,
				general_rejected_reason: payload.general_rejected_reason,
				section_rejected_reason: payload.section_rejected_reason,
				reject_reason: payload.general_rejected_reason,
			});
			toast.success(
				reviewState.label === "Approved"
					? "Compliance approval revoked"
					: "Compliance rejected successfully",
			);
			setRejectDialogOpen(false);
			onUpdated?.();
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	return (
		<>
			<Card>
				<CardHeader className="gap-4 border-b">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-1">
							<CardTitle className="font-semibold">
								{isApproved ? "Company Data" : "KYB Application Review"}
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								{reviewState.description}
							</p>
							{tenant?.general_rejected_reason ? (
								<p className="whitespace-pre-line text-sm text-red-700">
									{tenant.general_rejected_reason}
								</p>
							) : null}
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline" className={reviewState.badgeClassName}>
								{reviewState.label}
							</Badge>
							{reviewState.canApprove ? (
								<Button
									variant="outline"
									size="sm"
									disabled={isSaving}
									onClick={() => void handleApprove()}
								>
									<CheckCircleIcon />
									{isSaving ? "Saving..." : "Approve"}
								</Button>
							) : null}
							{reviewState.canReject ? (
								<Button
									variant="outline"
									size="sm"
									className="border-red-200 text-red-700 hover:bg-red-50"
									disabled={isSaving}
									onClick={() => setRejectDialogOpen(true)}
								>
									<XCircleIcon />
									{reviewState.rejectLabel}
								</Button>
							) : null}
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<Tabs
						value={activeSubTab}
						onValueChange={(value) => onSubTabChange(value as ComplianceSubTab)}
						className="min-w-0"
					>
						<div className="w-full min-w-0 overflow-x-auto no-scrollbar">
							<TabsList className="mb-6 inline-flex h-auto w-max min-w-full justify-start gap-2">
								{!isApproved ? (
									<TabsTrigger
										value={COMPLIANCE_SUB_TABS.REVIEW}
										className="shrink-0 flex-none"
									>
										<ClipboardTextIcon />
										KYB Application Review
									</TabsTrigger>
								) : null}
								<TabsTrigger
									value={COMPLIANCE_SUB_TABS.COMPANY_OVERVIEW}
									className="shrink-0 flex-none"
								>
									<BuildingsIcon />
									Company Overview
								</TabsTrigger>
								<TabsTrigger
									value={COMPLIANCE_SUB_TABS.PEOPLE_OWNERSHIP}
									className="shrink-0 flex-none"
								>
									<UsersIcon />
									People & Ownership
								</TabsTrigger>
								<TabsTrigger
									value={COMPLIANCE_SUB_TABS.BUSINESS_DETAILS}
									className="shrink-0 flex-none"
								>
									<FileTextIcon />
									Business Details
								</TabsTrigger>
								<TabsTrigger
									value={COMPLIANCE_SUB_TABS.DOCUMENTS}
									className="shrink-0 flex-none"
								>
									<FileTextIcon />
									Documents
								</TabsTrigger>
								<TabsTrigger
									value={COMPLIANCE_SUB_TABS.COMPLIANCE_DECLARATIONS}
									className="shrink-0 flex-none"
								>
									<ShieldCheckIcon />
									Compliance Declarations
								</TabsTrigger>
							</TabsList>
						</div>

						{!isApproved ? (
							<TabsContent value={COMPLIANCE_SUB_TABS.REVIEW}>
								<p className="text-sm text-muted-foreground">
									Review the application sections below before approving or
									rejecting this submission.
								</p>
							</TabsContent>
						) : null}

				<TabsContent value={COMPLIANCE_SUB_TABS.COMPANY_OVERVIEW}>
					<ComplianceSection
						title="Company Information"
						icon={BuildingsIcon}
						fields={[
							[
								"Legal Name",
								getComplianceFieldValue(
									complianceData.basic_information,
									"legal_name",
								),
							],
							[
								"Trading Name",
								getComplianceFieldValue(
									complianceData.basic_information,
									"trading_name",
								),
							],
							[
								"Country of Incorporation",
								getComplianceFieldValue(
									complianceData.basic_information,
									"country_of_incorporation",
								),
							],
							[
								"Registration Number",
								getComplianceFieldValue(
									complianceData.basic_information,
									"registration_number",
								),
							],
							[
								"Date of Incorporation",
								getComplianceFieldValue(
									complianceData.basic_information,
									"date_of_incorporation",
								),
							],
							[
								"Tax ID / VAT Number",
								getComplianceFieldValue(
									complianceData.basic_information,
									"tax_id_vat_number",
								),
							],
							[
								"Registered Address",
								getComplianceFieldValue(
									complianceData.basic_information,
									"registered_address",
								),
							],
							[
								"Business Address",
								getComplianceFieldValue(
									complianceData.basic_information,
									"business_address",
								),
							],
							[
								"Website",
								getComplianceFieldValue(
									complianceData.basic_information,
									"website",
								),
							],
						]}
					/>
					<ComplianceSection
						title="Primary Contact"
						icon={UsersIcon}
						fields={[
							[
								"Name",
								getComplianceFieldValue(
									complianceData.primary_contact,
									"name",
								),
							],
							[
								"Position",
								getComplianceFieldValue(
									complianceData.primary_contact,
									"position",
								),
							],
							[
								"Email",
								getComplianceFieldValue(
									complianceData.primary_contact,
									"email",
								),
							],
							[
								"Phone",
								getComplianceFieldValue(
									complianceData.primary_contact,
									"phone",
								),
							],
						]}
					/>
				</TabsContent>

				<TabsContent value={COMPLIANCE_SUB_TABS.PEOPLE_OWNERSHIP}>
					{directors.length === 0 ? (
						<EmptyComplianceState message="No directors submitted" />
					) : (
						directors.map((director, index) => (
							<ComplianceSection
								key={getCompliancePersonKey(director, "director")}
								title={`Director ${index + 1}`}
								icon={UsersIcon}
								fields={[
									["Name", getComplianceFieldValue(director, "name")],
									[
										"Date of Birth",
										getComplianceFieldValue(director, "date_of_birth"),
									],
									[
										"Nationality",
										getComplianceFieldValue(director, "nationality"),
									],
									["ID Number", getComplianceFieldValue(director, "id_number")],
									[
										"Address",
										getComplianceFieldValue(director, "address"),
									],
								]}
							/>
						))
					)}

					{ubos.length === 0 ? (
						<EmptyComplianceState message="No UBOs submitted" />
					) : (
						ubos.map((ubo, index) => (
							<ComplianceSection
								key={getCompliancePersonKey(ubo, "ubo")}
								title={`Ultimate Beneficial Owner ${index + 1}`}
								icon={UsersIcon}
								fields={[
									["Name", getComplianceFieldValue(ubo, "name")],
									[
										"Ownership Percentage",
										ubo.ownership_percentage !== undefined
											? `${ubo.ownership_percentage}%`
											: "Not provided",
									],
									["ID Number", getComplianceFieldValue(ubo, "id_number")],
								]}
							/>
						))
					)}
				</TabsContent>

				<TabsContent value={COMPLIANCE_SUB_TABS.BUSINESS_DETAILS}>
					<ComplianceSection
						title="Business Activity"
						icon={FileTextIcon}
						fields={[
							[
								"Nature of Business",
								getComplianceFieldValue(
									complianceData.business_activity,
									"nature_of_business",
								),
							],
							[
								"Description of Products/Services",
								getComplianceFieldValue(
									complianceData.business_activity,
									"description_of_products_services",
								),
							],
							[
								"Expected Monthly Verification Volume",
								getComplianceFieldValue(
									complianceData.business_activity,
									"expected_monthly_verification_volume",
								),
							],
							[
								"Main Geographies of Clients",
								getComplianceFieldValue(
									complianceData.business_activity,
									"main_geographies_of_clients",
								),
							],
							[
								"Regulatory Licenses Held",
								getComplianceFieldValue(
									complianceData.business_activity,
									"regulatory_licenses_held",
								),
							],
						]}
					/>
					<ComplianceSection
						title="Onboarding Questionnaire"
						icon={ClipboardTextIcon}
						fields={[
							[
								"Purpose of Account",
								getComplianceFieldValue(
									complianceData.onboarding_questionnaire,
									"purpose_of_account",
								),
							],
							[
								"Target Clients",
								getComplianceFieldValue(
									complianceData.onboarding_questionnaire,
									"target_clients",
								),
							],
							[
								"Average Client Transaction Size (EUR)",
								getComplianceFieldValue(
									complianceData.onboarding_questionnaire,
									"average_client_transaction_size_eur",
								),
							],
							[
								"High-Risk Jurisdictions / FATF Exposure",
								getComplianceFieldValue(
									complianceData.onboarding_questionnaire,
									"high_risk_jurisdictions_fatf_exposure",
								),
							],
							[
								"Main Banking / Payment Partners",
								getComplianceFieldValue(
									complianceData.onboarding_questionnaire,
									"main_banking_payment_partners",
								),
							],
							[
								"AML/CTF Officer",
								getComplianceFieldValue(
									complianceData.onboarding_questionnaire,
									"aml_ctf_officer",
								),
							],
						]}
					/>
				</TabsContent>

				<TabsContent value={COMPLIANCE_SUB_TABS.DOCUMENTS}>
					<ComplianceDocumentsSection complianceData={complianceData} />
				</TabsContent>

				<TabsContent value={COMPLIANCE_SUB_TABS.COMPLIANCE_DECLARATIONS}>
					{!hasComplianceDeclarations(complianceData) &&
					!authorizedSignature ? (
						<EmptyComplianceState message="Compliance declarations have not been completed" />
					) : (
						<div className="space-y-8">
							{hasComplianceDeclarations(complianceData) ? (
								<div className="space-y-4">
									<div className="flex items-center gap-2">
										<ShieldCheckIcon className="size-5 text-emerald-600" />
										<h3 className="text-base font-semibold">
											Compliance Declarations
										</h3>
									</div>
									<div className="space-y-3">
										{COMPLIANCE_DECLARATION_ITEMS.map((item) => {
											const accepted = getComplianceDeclarationValue(
												complianceData,
												item.key,
											);

											return (
												<div
													key={item.key}
													className="flex items-center gap-3 rounded-lg bg-muted/40 p-3"
												>
													{accepted ? (
														<CheckCircleIcon className="size-5 shrink-0 text-emerald-600" />
													) : (
														<XCircleIcon className="size-5 shrink-0 text-red-600" />
													)}
													<span className="text-sm">{item.label}</span>
												</div>
											);
										})}
									</div>
								</div>
							) : null}

							{authorizedSignature ? (
								<ComplianceSection
									title="Authorized Signatory"
									icon={FileTextIcon}
									fields={[
										[
											"Full Name",
											getComplianceFieldValue(
												authorizedSignature,
												"full_name",
											),
										],
										[
											"Position Title",
											getComplianceFieldValue(
												authorizedSignature,
												"position_title",
											),
										],
										[
											"Date",
											getComplianceFieldValue(authorizedSignature, "date"),
										],
										[
											"Signature",
											getComplianceFieldValue(
												authorizedSignature,
												"signature",
											),
										],
									]}
								/>
							) : null}
						</div>
					)}
				</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			<RejectComplianceDialog
				open={rejectDialogOpen}
				isRevokingApproval={reviewState.label === "Approved"}
				isSubmitting={isSaving}
				initialGeneralRejectedReason={tenant?.general_rejected_reason}
				initialSectionRejectedReason={tenant?.section_rejected_reason}
				onOpenChange={setRejectDialogOpen}
				onSubmit={(payload) => void handleReject(payload)}
			/>
		</>
	);
}

function EmptyComplianceState({ message }: { message: string }) {
	return (
		<p className="py-8 text-center text-sm text-muted-foreground">{message}</p>
	);
}

function ComplianceSection({
	title,
	icon: Icon,
	fields,
}: {
	title: string;
	icon: typeof BuildingsIcon;
	fields: [string, string][];
}) {
	return (
		<div className="mb-8 space-y-4">
			<div className="flex items-center gap-2">
				<Icon className="size-5 text-blue-600" />
				<h3 className="text-base font-semibold">{title}</h3>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{fields.map(([label, value]) => (
					<div key={label} className="space-y-1">
						<p className="text-sm font-medium text-muted-foreground">{label}</p>
						<p className="text-sm whitespace-pre-line">{value}</p>
					</div>
				))}
			</div>
		</div>
	);
}
