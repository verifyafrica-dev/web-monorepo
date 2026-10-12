import type {
	VerificationRequestCreatePayload,
	VerificationType,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

import { isTestWalletEnvironment } from "../../billing/-data";
import riskAssessmentChecksJson from "./risk_assessment.json";

const RISK_ASSESSMENT_TYPE = "risk_assessment" satisfies VerificationType;

export type RiskLevelKey = "low" | "medium" | "high" | "prohibited";

/** Risk ranges Shufti reports in `risk_score.range_name`; thresholds live on the Shufti profile. */
export const RISK_LEVELS = [
	{
		key: "low" as const,
		label: "Low",
		badgeClassName: "bg-teal-100 text-teal-800 border-teal-200",
	},
	{
		key: "medium" as const,
		label: "Medium",
		badgeClassName: "bg-sky-100 text-sky-800 border-sky-200",
	},
	{
		key: "high" as const,
		label: "High",
		badgeClassName: "bg-orange-100 text-orange-800 border-orange-200",
	},
	{
		key: "prohibited" as const,
		label: "Prohibited",
		badgeClassName: "bg-red-100 text-red-800 border-red-200",
	},
] satisfies Array<{
	key: RiskLevelKey;
	label: string;
	badgeClassName: string;
}>;

const ALL_RISK_ASSESSMENT_CHECKS =
	riskAssessmentChecksJson as RiskAssessmentCheck[];

/** Shufti test credentials only accept test profiles, and live credentials only live ones. */
export const RISK_ASSESSMENT_CHECKS = ALL_RISK_ASSESSMENT_CHECKS.filter(
	(check) => check.mode === (isTestWalletEnvironment() ? "test" : "live"),
);

export function findRiskAssessmentCheck(riskReference: string | undefined) {
	return riskReference
		? ALL_RISK_ASSESSMENT_CHECKS.find(
				(check) => check.risk_reference === riskReference,
			)
		: undefined;
}

export type RiskAssessmentCheck = {
	id: string;
	name: string;
	title: string;
	description: string;
	risk_reference: string;
	mode: "live" | "test";
};

type RiskAssessmentFormValues = {
	email: string;
	phone: string;
	selectedCheck: string;
};

export function buildRiskAssessmentPayload(
	values: RiskAssessmentFormValues,
): VerificationRequestCreatePayload {
	return {
		verification_type: RISK_ASSESSMENT_TYPE,
		method_type: "onsite",
		input_data: {
			email: values.email.trim(),
			language: "EN",
			risk_assessment: {
				phone_number: values.phone.trim(),
				risk_reference: values.selectedCheck,
			},
		},
	};
}
