import { z } from "zod";

import { isISODate, isPhoneNumber, isURL } from "#/lib/validators";

export interface UploadedDocument {
	id: string;
	file_name: string;
	file_size: number;
	file_type: string;
	uploaded_at: string;
	url: string;
	storage_path: string;
	author?: string;
}

export interface KYBDocuments {
	directors_identification: UploadedDocument[];
	proof_of_business_address: UploadedDocument[];
	proof_of_directors_address: UploadedDocument[];
	proof_of_website_domain_ownership: UploadedDocument[];
	legal_company_license: UploadedDocument[];
}

export interface DirectorAddress {
	address: string;
	postal_code: string;
	country: string;
}

export interface Director {
	name: string;
	date_of_birth: string;
	nationality: string;
	address: DirectorAddress | string;
	id_number: string;
}

export interface UBO {
	name: string;
	ownership_percentage: number;
	id_number: string;
}

export interface PrimaryContact {
	name: string;
	position: string;
	email: string;
	phone: string;
}

export interface RegulatoryLicense {
	license_name: string;
	license_number: string;
	country: string;
}

export interface RegisteredAddress {
	address: string;
	postal_code: string;
	country: string;
}

export interface BusinessAddress {
	address: string;
	postal_code: string;
	country: string;
}

export interface CompanyInformation {
	legal_name: string;
	trading_name?: string;
	country_of_incorporation: string;
	registration_number: string;
	date_of_incorporation: string;
	registered_address: RegisteredAddress;
	business_address?: BusinessAddress;
	website?: string;
	tax_id_vat_number?: string;
	primary_contact: PrimaryContact;
	directors: Director[];
	ubos: UBO[];
	business_activity: {
		nature_of_business: string;
		description_of_products_services: string;
		expected_monthly_verification_volume: string;
		main_geographies_of_clients: string[];
		regulatory_licenses_held: RegulatoryLicense[];
	};
}

export interface OnboardingQuestionnaire {
	purpose_of_account: string;
	target_clients: string;
	average_client_transaction_size_eur: number;
	high_risk_jurisdictions_fatf_exposure: string;
	main_banking_payment_partners: string;
	aml_ctf_officer?: {
		name: string;
		email: string;
	};
}

export interface ComplianceDeclarations {
	not_engaged_in_prohibited_activities: boolean;
	no_directors_ubos_on_sanctions_lists: boolean;
	information_true_and_complete: boolean;
	agree_to_provide_supporting_documents: boolean;
}

export interface AuthorizedSignatory {
	full_name: string;
	position_title: string;
	date: string;
	signature?: string;
}

export interface KYBApplication {
	company: CompanyInformation;
	documents: KYBDocuments;
	onboarding_questionnaire: OnboardingQuestionnaire;
	compliance_declarations: ComplianceDeclarations;
	authorized_signature: AuthorizedSignatory;
	submitted_for_review: boolean;
	last_submission_date: string;
}

export type KycStatus = "pending" | "submitted" | "approved" | "rejected";

const optionalUrlSchema = z
	.string()
	.optional()
	.refine((value) => !value || isURL(value), {
		message: "Please enter a valid URL",
	});

function isTodayOrFutureISODate(value: string, disableFuture: boolean = true) {
	if (!isISODate(value)) {
		return false;
	}

	const selectedDate = new Date(`${value}T00:00:00`);
	selectedDate.setHours(0, 0, 0, 0);

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return disableFuture ? selectedDate <= today : selectedDate >= today;
}

function isNotFutureISODate(value: string) {
	return isTodayOrFutureISODate(value, true);
}

function isTodayISODate(value: string) {
	if (!isISODate(value)) {
		return false;
	}

	const selectedDate = new Date(`${value}T00:00:00`);
	selectedDate.setHours(0, 0, 0, 0);

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return selectedDate.getTime() === today.getTime();
}

export const KycBasicInformationFormSchema = z.object({
	legalName: z.string().trim().min(1, "Legal name is required"),
	tradingName: z.string().optional(),
	countryOfIncorporation: z
		.string()
		.trim()
		.min(1, "Country of incorporation is required"),
	registrationNumber: z.string().trim().min(1, "Registration number is required"),
	dateOfIncorporation: z
		.string()
		.trim()
		.min(1, "Date of incorporation is required")
		.refine(isISODate, "Please enter a valid date (YYYY-MM-DD)")
		.refine(
			(value) => isTodayOrFutureISODate(value),
			"Date of incorporation cannot be earlier than today",
		),
	registeredAddress: z.string().trim().min(1, "Registered address is required"),
	registeredPostalCode: z.string().trim().min(1, "Postal code is required"),
	registeredCountry: z.string().trim().min(1, "Country is required"),
	businessAddress: z.string().optional(),
	businessPostalCode: z.string().optional(),
	businessCountry: z.string().optional(),
	website: optionalUrlSchema,
	taxIdVatNumber: z.string().optional(),
});

export type KycBasicInformationFormValues = z.infer<
	typeof KycBasicInformationFormSchema
>;

export const KycPrimaryContactFormSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	position: z.string().trim().min(1, "Position is required"),
	email: z.email("Please enter a valid email address"),
	phone: z
		.string()
		.trim()
		.min(1, "Phone number is required")
		.refine(isPhoneNumber, "Please enter a valid phone number"),
});

export type KycPrimaryContactFormValues = z.infer<
	typeof KycPrimaryContactFormSchema
>;

export const KycDirectorAddressSchema = z.object({
	address: z.string().trim().min(1, "Address is required"),
	postal_code: z.string().trim().min(1, "Postal code is required"),
	country: z.string().trim().min(1, "Country is required"),
});

export const KycDirectorFormSchema = z.object({
	name: z.string().trim().min(1, "Full name is required"),
	date_of_birth: z
		.string()
		.trim()
		.min(1, "Date of birth is required")
		.refine(isISODate, "Please enter a valid date (YYYY-MM-DD)")
		.refine(isNotFutureISODate, "Date of birth cannot be in the future"),
	nationality: z.string().trim().min(1, "Nationality is required"),
	address: KycDirectorAddressSchema,
	id_number: z.string().trim().min(1, "ID number is required"),
});

export const KycUboFormSchema = z.object({
	name: z.string().trim().min(1, "Full name is required"),
	ownership_percentage: z
		.number()
		.gt(0, "Ownership percentage must be greater than 0")
		.max(100, "Ownership percentage cannot exceed 100%"),
	id_number: z.string().trim().min(1, "ID number is required"),
});

export const KycDirectorsAndShareholdersFormSchema = z
	.object({
		directors: z
			.array(KycDirectorFormSchema)
			.min(1, "At least one director is required"),
		ubos: z.array(KycUboFormSchema).min(1, "At least one UBO is required"),
	})
	.superRefine((values, context) => {
		const totalOwnership = values.ubos.reduce(
			(sum, ubo) => sum + ubo.ownership_percentage,
			0,
		);

		if (Math.abs(totalOwnership - 100) > 0.01) {
			context.addIssue({
				code: "custom",
				path: ["ubos"],
				message: `Ownership percentages must equal 100% (currently ${totalOwnership}%)`,
			});
		}
	});

export type KycDirectorsAndShareholdersFormValues = z.infer<
	typeof KycDirectorsAndShareholdersFormSchema
>;

export const KycRegulatoryLicenseFormSchema = z.object({
	license_name: z.string().trim().min(1, "License name is required"),
	license_number: z.string().trim().min(1, "License number is required"),
	country: z.string().trim().min(1, "Country is required"),
});

export const KycBusinessActivityFormSchema = z.object({
	nature_of_business: z.string().trim().min(1, "Nature of business is required"),
	description_of_products_services: z
		.string()
		.trim()
		.min(1, "Description of products/services is required"),
	expected_monthly_verification_volume: z
		.string()
		.trim()
		.min(1, "Expected monthly verification volume is required"),
	main_geographies_of_clients: z
		.array(z.string().trim().min(1))
		.min(1, "Main geographies of clients is required"),
	regulatory_licenses_held: z.array(KycRegulatoryLicenseFormSchema),
});

export type KycBusinessActivityFormValues = z.infer<
	typeof KycBusinessActivityFormSchema
>;

export const KycOnboardingQuestionnaireFormSchema = z.object({
	purpose_of_account: z.string().trim().min(1, "Purpose of account is required"),
	target_clients: z.string().trim().min(1, "Target clients is required"),
	average_client_transaction_size_eur: z.coerce
		.number()
		.nonnegative("Average transaction size must be a positive number"),
	high_risk_jurisdictions_fatf_exposure: z
		.string()
		.trim()
		.min(1, "High risk jurisdictions exposure is required"),
	main_banking_payment_partners: z
		.string()
		.trim()
		.min(1, "Main banking/payment partners is required"),
	amlCtfOfficerName: z.string().trim().min(1, "AML/CTF Officer name is required"),
	amlCtfOfficerEmail: z.email("Please enter a valid email address"),
});

export type KycOnboardingQuestionnaireFormValues = z.infer<
	typeof KycOnboardingQuestionnaireFormSchema
>;

export const KycComplianceDeclarationsFormSchema = z.object({
	not_engaged_in_prohibited_activities: z.boolean().refine(Boolean, {
		message: "This declaration is required",
	}),
	no_directors_ubos_on_sanctions_lists: z.boolean().refine(Boolean, {
		message: "This declaration is required",
	}),
	information_true_and_complete: z.boolean().refine(Boolean, {
		message: "This declaration is required",
	}),
	agree_to_provide_supporting_documents: z.boolean().refine(Boolean, {
		message: "This declaration is required",
	}),
});

export type KycComplianceDeclarationsFormValues = z.infer<
	typeof KycComplianceDeclarationsFormSchema
>;

export const KycAuthorizedSignatureFormSchema = z.object({
	full_name: z.string().trim().min(1, "Full name is required"),
	position_title: z.string().trim().min(1, "Position title is required"),
	date: z
		.string()
		.trim()
		.min(1, "Date is required")
		.refine(isISODate, "Please enter a valid date (YYYY-MM-DD)")
		.refine(isTodayISODate, "Date must be today's date"),
	signature: z.string().trim().min(1, "Signature is required"),
});

export type KycAuthorizedSignatureFormValues = z.infer<
	typeof KycAuthorizedSignatureFormSchema
>;

export type KycComplianceSavePayload = {
	compliance_data: KYBApplication;
};

function normalizeUploadedDocument(doc: unknown): UploadedDocument | null {
	if (!doc || typeof doc !== "object") {
		return null;
	}

	const record = doc as Record<string, unknown>;

	return {
		id: String(record.id ?? ""),
		file_name: String(record.file_name ?? record.fileName ?? ""),
		file_size: Number(record.file_size ?? record.fileSize ?? 0),
		file_type: String(record.file_type ?? record.fileType ?? ""),
		uploaded_at: String(record.uploaded_at ?? record.uploadedAt ?? ""),
		url: String(record.url ?? ""),
		storage_path: String(record.storage_path ?? record.storagePath ?? ""),
		author: record.author ? String(record.author) : undefined,
	};
}

function normalizeAddress(
	address: unknown,
	fallback: RegisteredAddress,
): RegisteredAddress {
	if (!address || typeof address !== "object") {
		return fallback;
	}

	const record = address as Record<string, unknown>;

	return {
		address: String(record.address ?? fallback.address),
		postal_code: String(record.postal_code ?? record.postalCode ?? fallback.postal_code),
		country: String(record.country ?? fallback.country),
	};
}

function normalizeDirector(director: unknown): Director {
	const record = (director ?? {}) as Record<string, unknown>;
	const emptyAddress: DirectorAddress = {
		address: "",
		postal_code: "",
		country: "",
	};

	return {
		name: String(record.name ?? ""),
		date_of_birth: String(record.date_of_birth ?? record.dateOfBirth ?? ""),
		nationality: String(record.nationality ?? ""),
		address: normalizeAddress(record.address, emptyAddress),
		id_number: String(record.id_number ?? record.idNumber ?? ""),
	};
}

function normalizeUbo(ubo: unknown): UBO {
	const record = (ubo ?? {}) as Record<string, unknown>;

	return {
		name: String(record.name ?? ""),
		ownership_percentage: Number(
			record.ownership_percentage ?? record.ownershipPercentage ?? 0,
		),
		id_number: String(record.id_number ?? record.idNumber ?? ""),
	};
}

export function createEmptyKYBApplication(): KYBApplication {
	return {
		company: {
			legal_name: "",
			country_of_incorporation: "",
			registration_number: "",
			date_of_incorporation: "",
			registered_address: {
				address: "",
				postal_code: "",
				country: "",
			},
			business_address: {
				address: "",
				postal_code: "",
				country: "",
			},
			primary_contact: {
				name: "",
				position: "",
				email: "",
				phone: "",
			},
			directors: [],
			ubos: [],
			business_activity: {
				nature_of_business: "",
				description_of_products_services: "",
				expected_monthly_verification_volume: "",
				main_geographies_of_clients: [],
				regulatory_licenses_held: [],
			},
		},
		documents: {
			directors_identification: [],
			proof_of_business_address: [],
			proof_of_directors_address: [],
			proof_of_website_domain_ownership: [],
			legal_company_license: [],
		},
		onboarding_questionnaire: {
			purpose_of_account: "",
			target_clients: "",
			average_client_transaction_size_eur: 0,
			high_risk_jurisdictions_fatf_exposure: "",
			main_banking_payment_partners: "",
		},
		compliance_declarations: {
			not_engaged_in_prohibited_activities: false,
			no_directors_ubos_on_sanctions_lists: false,
			information_true_and_complete: false,
			agree_to_provide_supporting_documents: false,
		},
		authorized_signature: {
			full_name: "",
			position_title: "",
			date: "",
		},
		submitted_for_review: false,
		last_submission_date: "",
	};
}

export function normalizeComplianceData(data: unknown): KYBApplication {
	if (
		!data ||
		data === "" ||
		(typeof data === "object" && Object.keys(data as object).length === 0)
	) {
		return createEmptyKYBApplication();
	}

	const record = data as Record<string, unknown>;
	const empty = createEmptyKYBApplication();

	if ("company" in record) {
		const legacy = record as Partial<KYBApplication>;

		return {
			...empty,
			...legacy,
			company: {
				...empty.company,
				...(legacy.company ?? {}),
			},
			documents: {
				...empty.documents,
				...(legacy.documents ?? {}),
			},
			onboarding_questionnaire: {
				...empty.onboarding_questionnaire,
				...(legacy.onboarding_questionnaire ?? {}),
			},
			compliance_declarations: {
				...empty.compliance_declarations,
				...(legacy.compliance_declarations ?? {}),
			},
			authorized_signature: {
				...empty.authorized_signature,
				...(legacy.authorized_signature ?? {}),
			},
		};
	}

	const basicInformation =
		(record.basic_information as Record<string, unknown> | undefined) ?? {};
	const primaryContactRaw =
		(record.primary_contact as Record<string, unknown> | undefined) ?? {};
	const directorsAndShareholders =
		(record.directors_and_shareholders as
			| { directors?: unknown[]; ubos?: unknown[] }
			| undefined) ?? {};
	const businessActivityRaw =
		(record.business_activity as Record<string, unknown> | undefined) ?? {};
	const documentsUpload =
		(record.documents_upload as Record<string, unknown[]> | undefined) ?? {};
	const onboardingQuestionnaireRaw =
		(record.onboarding_questionnaire as Record<string, unknown> | undefined) ??
		{};
	const complianceDeclarationsRaw = record.compliance_declarations;
	const authorizedSignatureRaw =
		(record.authorized_signature as Record<string, unknown> | undefined) ?? {};

	const normalizeDocumentList = (docs: unknown[] | undefined) =>
		(docs ?? [])
			.map(normalizeUploadedDocument)
			.filter((doc): doc is UploadedDocument => doc !== null);

	return {
		company: {
			legal_name: String(basicInformation.legal_name ?? basicInformation.legalName ?? ""),
			trading_name: basicInformation.trading_name
				? String(basicInformation.trading_name)
				: basicInformation.tradingName
					? String(basicInformation.tradingName)
					: undefined,
			country_of_incorporation: String(
				basicInformation.country_of_incorporation ??
					basicInformation.countryOfIncorporation ??
					"",
			),
			registration_number: String(
				basicInformation.registration_number ??
					basicInformation.registrationNumber ??
					"",
			),
			date_of_incorporation: String(
				basicInformation.date_of_incorporation ??
					basicInformation.dateOfIncorporation ??
					"",
			),
			registered_address: normalizeAddress(
				basicInformation.registered_address ?? basicInformation.registeredAddress,
				empty.company.registered_address,
			),
			business_address: normalizeAddress(
				basicInformation.business_address ?? basicInformation.businessAddress,
				empty.company.business_address ?? empty.company.registered_address,
			),
			website: basicInformation.website
				? String(basicInformation.website)
				: undefined,
			tax_id_vat_number: basicInformation.tax_id_vat_number
				? String(basicInformation.tax_id_vat_number)
				: basicInformation.taxIdVatNumber
					? String(basicInformation.taxIdVatNumber)
					: undefined,
			primary_contact: {
				name: String(primaryContactRaw.name ?? empty.company.primary_contact.name),
				position: String(
					primaryContactRaw.position ?? empty.company.primary_contact.position,
				),
				email: String(
					primaryContactRaw.email ?? empty.company.primary_contact.email,
				),
				phone: String(
					primaryContactRaw.phone ?? empty.company.primary_contact.phone,
				),
			},
			directors: (directorsAndShareholders.directors ?? []).map(normalizeDirector),
			ubos: (directorsAndShareholders.ubos ?? []).map(normalizeUbo),
			business_activity: {
				nature_of_business: String(
					businessActivityRaw.nature_of_business ??
						businessActivityRaw.natureOfBusiness ??
						"",
				),
				description_of_products_services: String(
					businessActivityRaw.description_of_products_services ??
						businessActivityRaw.descriptionOfProductsServices ??
						"",
				),
				expected_monthly_verification_volume: String(
					businessActivityRaw.expected_monthly_verification_volume ??
						businessActivityRaw.expectedMonthlyVerificationVolume ??
						"",
				),
				main_geographies_of_clients: (() => {
					const geographies =
						businessActivityRaw.main_geographies_of_clients ??
						businessActivityRaw.mainGeographiesOfClients;
					return Array.isArray(geographies)
						? geographies.map((geography) => String(geography))
						: [];
				})(),
				regulatory_licenses_held: Array.isArray(
					businessActivityRaw.regulatory_licenses_held ??
						businessActivityRaw.regulatoryLicensesHeld,
				)
					? ((businessActivityRaw.regulatory_licenses_held ??
							businessActivityRaw.regulatoryLicensesHeld) as RegulatoryLicense[])
					: [],
			},
		},
		documents: {
			directors_identification: normalizeDocumentList(
				documentsUpload.directors_identification ??
					documentsUpload.directorsIdentification,
			),
			proof_of_business_address: normalizeDocumentList(
				documentsUpload.proof_of_business_address ??
					documentsUpload.proofOfBusinessAddress,
			),
			proof_of_directors_address: normalizeDocumentList(
				documentsUpload.proof_of_directors_address ??
					documentsUpload.proofOfDirectorsAddress,
			),
			proof_of_website_domain_ownership: normalizeDocumentList(
				documentsUpload.proof_of_website_domain_ownership ??
					documentsUpload.proofOfWebsiteDomainOwnership,
			),
			legal_company_license: normalizeDocumentList(
				documentsUpload.legal_company_license ??
					documentsUpload.legalCompanyLicense,
			),
		},
		onboarding_questionnaire: {
			purpose_of_account: String(
				onboardingQuestionnaireRaw.purpose_of_account ??
					onboardingQuestionnaireRaw.purposeOfAccount ??
					"",
			),
			target_clients: String(
				onboardingQuestionnaireRaw.target_clients ??
					onboardingQuestionnaireRaw.targetClients ??
					"",
			),
			average_client_transaction_size_eur: Number(
				onboardingQuestionnaireRaw.average_client_transaction_size_eur ??
					onboardingQuestionnaireRaw.averageClientTransactionSizeEur ??
					0,
			),
			high_risk_jurisdictions_fatf_exposure: String(
				onboardingQuestionnaireRaw.high_risk_jurisdictions_fatf_exposure ??
					onboardingQuestionnaireRaw.highRiskJurisdictionsFATFExposure ??
					"",
			),
			main_banking_payment_partners: String(
				onboardingQuestionnaireRaw.main_banking_payment_partners ??
					onboardingQuestionnaireRaw.mainBankingPaymentPartners ??
					"",
			),
			aml_ctf_officer:
				onboardingQuestionnaireRaw.aml_ctf_officer ??
				onboardingQuestionnaireRaw.amlCtfOfficer
					? {
							name: String(
								(
									(onboardingQuestionnaireRaw.aml_ctf_officer ??
										onboardingQuestionnaireRaw.amlCtfOfficer) as Record<
										string,
										unknown
									>
								).name ?? "",
							),
							email: String(
								(
									(onboardingQuestionnaireRaw.aml_ctf_officer ??
										onboardingQuestionnaireRaw.amlCtfOfficer) as Record<
										string,
										unknown
									>
								).email ?? "",
							),
						}
					: undefined,
		},
		compliance_declarations:
			complianceDeclarationsRaw === true
				? {
						not_engaged_in_prohibited_activities: true,
						no_directors_ubos_on_sanctions_lists: true,
						information_true_and_complete: true,
						agree_to_provide_supporting_documents: true,
					}
				: typeof complianceDeclarationsRaw === "object" &&
						complianceDeclarationsRaw !== null
					? {
							not_engaged_in_prohibited_activities: Boolean(
								(complianceDeclarationsRaw as Record<string, unknown>)
									.not_engaged_in_prohibited_activities ??
									(complianceDeclarationsRaw as Record<string, unknown>)
										.notEngagedInProhibitedActivities,
							),
							no_directors_ubos_on_sanctions_lists: Boolean(
								(complianceDeclarationsRaw as Record<string, unknown>)
									.no_directors_ubos_on_sanctions_lists ??
									(complianceDeclarationsRaw as Record<string, unknown>)
										.noDirectorsUbosOnSanctionsLists,
							),
							information_true_and_complete: Boolean(
								(complianceDeclarationsRaw as Record<string, unknown>)
									.information_true_and_complete ??
									(complianceDeclarationsRaw as Record<string, unknown>)
										.informationTrueAndComplete,
							),
							agree_to_provide_supporting_documents: Boolean(
								(complianceDeclarationsRaw as Record<string, unknown>)
									.agree_to_provide_supporting_documents ??
									(complianceDeclarationsRaw as Record<string, unknown>)
										.agreeToProvideSupportingDocuments,
							),
						}
					: empty.compliance_declarations,
		authorized_signature: {
			full_name: String(
				authorizedSignatureRaw.full_name ??
					authorizedSignatureRaw.fullName ??
					"",
			),
			position_title: String(
				authorizedSignatureRaw.position_title ??
					authorizedSignatureRaw.positionTitle ??
					"",
			),
			date: String(authorizedSignatureRaw.date ?? ""),
			signature: authorizedSignatureRaw.signature
				? String(authorizedSignatureRaw.signature)
				: undefined,
		},
		submitted_for_review: false,
		last_submission_date: "",
	};
}

export function normalizeWebsiteUrl(website: string | undefined) {
	if (!website?.trim()) {
		return undefined;
	}

	const value = website.trim();
	return value.match(/^https?:\/\//i) ? value : `https://${value}`;
}
