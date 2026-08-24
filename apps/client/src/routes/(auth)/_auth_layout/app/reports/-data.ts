import type {
	VerificationBatch,
	VerificationRequest,
} from "#/api/http/v2/verifications/verifications.types";
import { isPlainObject } from "@verifyafrica/ui/lib/validators";

export type VerificationReport = {
	id: string;
	batch_id: string | null;
	verification_type: string;
	mixed_verification_name?: string;
	status: string;
	name: string;
	created_at: string;
	currency: string;
	cost_charged: string;
	country?: string;
};

export type BatchVerificationReport = {
	id: string;
	status: string;
	total_count: number;
	success_count: number;
	failed_count: number;
	created_at: string;
};

export const REPORTS_PAGE_SIZE = 10;

export const COUNTRY_CODE_MAP: Record<string, string> = {
	ng: "Nigeria",
	gh: "Ghana",
	ke: "Kenya",
	za: "South Africa",
};

function capitalize(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function isValidWalletAddress(walletAddress: string | null | undefined) {
	const evmWalletPattern = /^0x[a-fA-F0-9]{40}$/;
	const bitcoinWalletPattern =
		/^(bc1[p-z0-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
	const tronWalletPattern = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
	const solanaWalletPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
	const value = (walletAddress ?? "").trim();

	return (
		evmWalletPattern.test(value) ||
		bitcoinWalletPattern.test(value) ||
		tronWalletPattern.test(value) ||
		solanaWalletPattern.test(value)
	);
}

function getResponseDataRecord(verification: VerificationRequest) {
	return isPlainObject(verification.response_data)
		? (verification.response_data as Record<string, unknown>)
		: {};
}

function getResponseInnerData(verification: VerificationRequest) {
	const responseData = getResponseDataRecord(verification);
	return isPlainObject(responseData.data)
		? (responseData.data as Record<string, unknown>)
		: {};
}

export function getVerificationCountry(
	verification: VerificationRequest,
): string | undefined {
	const innerData = getResponseInnerData(verification);
	const idType = innerData.id_type;

	if (typeof idType === "string" && idType.length >= 2) {
		const prefix = idType.substring(0, 2).toLowerCase();
		return COUNTRY_CODE_MAP[prefix];
	}

	return undefined;
}

export function getVerificationTargetName(
	verification: VerificationRequest,
): string {
	const { input_data } = verification;
	const innerData = getResponseInnerData(verification);

	if (
		typeof innerData.first_name === "string" &&
		typeof innerData.last_name === "string"
	) {
		return `${innerData.first_name} ${innerData.last_name}`;
	}

	if (typeof innerData.name_on_card === "string") {
		return innerData.name_on_card;
	}

	if (isPlainObject(input_data?.background_checks)) {
		const backgroundChecks = input_data.background_checks as Record<
			string,
			unknown
		>;
		if (isPlainObject(backgroundChecks.name)) {
			const name = backgroundChecks.name as Record<string, unknown>;
			const firstName = name.first_name;
			const lastName = name.last_name;
			const fullName = name.full_name;

			if (typeof firstName === "string" && typeof lastName === "string") {
				return capitalize(`${firstName} ${lastName}`);
			}

			if (typeof fullName === "string") {
				return isValidWalletAddress(fullName)
					? fullName.slice(0, 10)
					: capitalize(fullName);
			}
		}
	}

	if (isPlainObject(input_data?.aml_for_businesses)) {
		const aml = input_data.aml_for_businesses as Record<string, unknown>;
		if (typeof aml.business_name === "string") {
			return capitalize(aml.business_name);
		}
	}

	if (isPlainObject(input_data?.kyb)) {
		const kyb = input_data.kyb as Record<string, unknown>;
		if (typeof kyb.company_name === "string") {
			return capitalize(kyb.company_name);
		}
	}

	if (typeof input_data?.email === "string") {
		return input_data.email;
	}

	return "N/A";
}

export function mapVerificationRequestToReport(
	verification: VerificationRequest,
): VerificationReport {
	const inputData = isPlainObject(verification.input_data)
		? verification.input_data
		: {};
	const mixedVerificationName =
		typeof inputData.mixed_verification_name === "string"
			? inputData.mixed_verification_name
			: undefined;

	return {
		id: verification.id,
		batch_id: verification.batch_id,
		verification_type: verification.verification_type,
		mixed_verification_name: mixedVerificationName,
		status: verification.status,
		name: getVerificationTargetName(verification),
		created_at: verification.created_at,
		currency: verification.currency,
		cost_charged: verification.cost_charged,
		country: getVerificationCountry(verification),
	};
}

export function mapVerificationRequestsToReports(
	verifications: VerificationRequest[],
): VerificationReport[] {
	return verifications.map(mapVerificationRequestToReport);
}

export function mapVerificationBatchToReport(
	batch: VerificationBatch,
): BatchVerificationReport {
	return {
		id: batch.id,
		status: batch.status,
		total_count: batch.total_count,
		success_count: batch.success_count,
		failed_count: batch.failed_count,
		created_at: batch.created_at,
	};
}

export function mapVerificationBatchesToReports(
	batches: VerificationBatch[],
): BatchVerificationReport[] {
	return batches.map(mapVerificationBatchToReport);
}

export function formatVerificationType(report: VerificationReport) {
	const formattedType = report.verification_type
		.replace(/_/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());

	if (
		report.verification_type === "mixed_verification" &&
		report.mixed_verification_name
	) {
		return `${formattedType}: ${report.mixed_verification_name}`;
	}

	return formattedType;
}

export function formatReportDate(dateString: string) {
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(dateString));
}
