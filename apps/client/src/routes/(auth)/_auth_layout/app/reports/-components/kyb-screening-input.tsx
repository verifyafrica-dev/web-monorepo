import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { getCountryName } from "@verifyafrica/ui/lib/country-state-city";
import {
	displayValue,
	formatHumanLabel,
	formatStringList,
	formatYesNo,
} from "../-utils";
import { ReportDetailField } from "./report-detail-field";

const KYB_BASE_LABELS: Record<string, string> = {
	search: "Search",
	document: "Document",
	document_purchase: "Document Purchase",
};

const KYB_SEARCH_TYPE_LABELS: Record<string, string> = {
	fuzzy: "Fuzzy",
	contains: "Contains",
	start_with: "Starts With",
};

const KYB_IDENTIFIER_LABELS: Record<string, string> = {
	company_name: "Company Name",
	registration_number: "Company Registration Number",
	vat_number: "VAT Number",
	freelance_number: "Freelance Number",
	tax_identification_number: "Tax Identification Number",
	commercial_registration_number: "Commercial Registration Number",
	cnpj_number: "CNPJ Number",
	trn_number: "TRN Number",
	iban_number: "IBAN Number",
	license_number: "License Number",
	vat_certificate_number: "VAT Certificate Number",
};

export function KybScreeningInput({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	const inputData = verification.input_data;
	const kyb = inputData.kyb;
	const jurisdiction = kyb?.company_jurisdiction_code || inputData.country;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					KYB Input Data
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<ReportDetailField
					label="Email"
					value={displayValue(inputData.email)}
				/>
				<ReportDetailField
					label="Language"
					value={displayValue(inputData.language)}
				/>
				<ReportDetailField
					label="KYB Base"
					value={displayValue(
						kyb?.base
							? (KYB_BASE_LABELS[kyb.base] ?? formatHumanLabel(kyb.base))
							: undefined,
					)}
				/>
				<ReportDetailField
					label="Business Jurisdiction"
					value={displayValue(
						jurisdiction
							? getCountryName(jurisdiction) || formatHumanLabel(jurisdiction)
							: undefined,
					)}
				/>
				<ReportDetailField
					label="Company Name"
					value={displayValue(kyb?.company_name)}
				/>
				<ReportDetailField
					label="Company Registration Number"
					value={displayValue(kyb?.company_registration_number)}
				/>
				<ReportDetailField
					label="Search Type"
					value={displayValue(
						kyb?.search_type
							? KYB_SEARCH_TYPE_LABELS[kyb.search_type] ??
								formatHumanLabel(kyb.search_type)
							: undefined,
					)}
				/>
				<ReportDetailField
					label="Search Identifier"
					value={displayValue(
						kyb?.search_by
							? KYB_IDENTIFIER_LABELS[kyb.search_by] ??
								formatHumanLabel(kyb.search_by)
							: undefined,
					)}
				/>
				<ReportDetailField
					label="Other Identifier Value"
					value={displayValue(kyb?.search_word)}
				/>
				<ReportDetailField
					label="Advanced Search"
					value={displayValue(formatYesNo(kyb?.advanced_search))}
				/>
				<ReportDetailField
					label="AI Business Insights"
					value={displayValue(formatYesNo(kyb?.ai_business_insights))}
				/>
				<ReportDetailField
					label="Validate Document"
					value={displayValue(formatYesNo(kyb?.validate_document))}
				/>
				<ReportDetailField
					label="Required Documents"
					className="sm:col-span-2"
					value={displayValue(formatStringList(kyb?.required_documents))}
				/>
				<ReportDetailField
					label="Additional Proof Labels"
					className="sm:col-span-2"
					value={displayValue(formatStringList(kyb?.additional_proof_labels))}
				/>
			</CardContent>
		</Card>
	);
}
