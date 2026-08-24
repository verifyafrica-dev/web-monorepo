import type {
	VerificationRequestCreatePayload,
	VerificationType,
} from "#/api/http/v2/verifications/verifications.types";

const RISK_ASSESSMENT_TYPE = "risk_assessment" satisfies VerificationType;

import riskAssessmentChecksJson from "./risk_assessment.json";

export type RiskLevelKey = "low" | "medium" | "high" | "prohibited";

export type RiskRange = {
	min: number;
	max: number;
	enabled: boolean;
};

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
		badgeClassName: "bg-muted text-muted-foreground border-border",
	},
] satisfies Array<{
	key: RiskLevelKey;
	label: string;
	badgeClassName: string;
}>;

export const DEFAULT_RISK_RANGES: Record<RiskLevelKey, RiskRange> = {
	low: { min: 0, max: 40, enabled: true },
	medium: { min: 41, max: 70, enabled: true },
	high: { min: 71, max: 100, enabled: true },
	prohibited: { min: 100, max: 100, enabled: true },
};

export const RISK_ASSESSMENT_CHECKS = (
	riskAssessmentChecksJson as RiskAssessmentCheck[]
).filter((check) => check.mode === "live");

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
