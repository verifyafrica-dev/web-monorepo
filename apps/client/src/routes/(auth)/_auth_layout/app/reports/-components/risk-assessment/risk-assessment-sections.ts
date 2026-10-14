import {
	findRiskAssessmentCheck,
	RISK_LEVELS,
} from "../../../products/risk-assessment/-data";
import {
	asNonEmptyString,
	asRecord,
	asUnknownArray,
	formatHumanLabel,
	getResponsePayload,
	type UnknownRecord,
} from "../../-utils";
import {
	buildProviderOutcome,
	computed,
	leftoverFields,
	type ProviderOutcome,
	type ReportCheck,
	SHARED_RESPONSE_KEYS,
	sharedRequestFields,
	withoutEmpty,
} from "../report-builders";
import type { ReportField } from "../report-sections";

export type RiskLevel = (typeof RISK_LEVELS)[number];

export type RiskServiceCheck = {
	key: string;
	name: string;
	status: string;
};

export type RiskQuestion = {
	key: string;
	question: string;
	answer?: string;
};

export type RiskQuestionGroup = {
	key: string;
	title?: string;
	questions: RiskQuestion[];
};

export type RiskAssessmentSections = {
	submitted: ReportField[];
	outcome: ProviderOutcome;
	checks: ReportCheck[];
	assessmentTitle?: string;
	riskLevel?: RiskLevel;
	rangeName?: string;
	scores: ReportField[];
	services: RiskServiceCheck[];
	questionnaire: RiskQuestionGroup[];
	additional: ReportField[];
	hasResult: boolean;
};

const KNOWN_INPUT_KEYS = new Set([
	"email",
	"country",
	"language",
	"mode",
	"method_type",
	"risk_assessment",
	"reference",
	"callback_url",
	"redirect_url",
]);

const KNOWN_ASSESSMENT_KEYS = new Set([
	"title",
	"risk_score",
	"services",
	"questionnaire",
]);

const KNOWN_SCORE_KEYS = new Set([
	"range_name",
	"total_assessment_score",
	"questionnaire_score",
	"fraud_prevention_score",
]);

function records(value: unknown): UnknownRecord[] {
	return asUnknownArray(value).flatMap((item) => {
		const record = asRecord(item);
		return record ? [record] : [];
	});
}

function scoreValue(value: unknown) {
	if (value === null || value === undefined || value === "") return undefined;
	return String(value);
}

function questionnaireGroups(value: unknown): RiskQuestionGroup[] {
	return records(value).flatMap((group, groupIndex) => {
		const questions = records(group.questions).flatMap(
			(item, questionIndex) => {
				const question = asNonEmptyString(item.question);
				if (!question) return [];
				const answer = Array.isArray(item.answer)
					? item.answer.map(String).join(", ")
					: asNonEmptyString(item.answer);
				return [
					{
						key: `${groupIndex}-${questionIndex}`,
						question,
						answer,
					},
				];
			},
		);
		return questions.length > 0
			? [
					{
						key: `group-${groupIndex}`,
						title: asNonEmptyString(group.title),
						questions,
					},
				]
			: [];
	});
}

export function buildRiskAssessmentSections({
	inputData,
	responseData,
}: {
	inputData: unknown;
	responseData: unknown;
}): RiskAssessmentSections {
	const input = asRecord(inputData) ?? {};
	const inputSection = asRecord(input.risk_assessment) ?? {};
	const response = getResponsePayload(responseData);
	const assessment =
		asRecord(asRecord(response.verification_data)?.risk_assessment) ??
		asRecord(response.risk_assessment) ??
		{};
	const riskScore = asRecord(assessment.risk_score) ?? {};
	const results = asRecord(response.verification_result) ?? {};

	const riskReference = asNonEmptyString(inputSection.risk_reference);
	const profile = findRiskAssessmentCheck(riskReference);
	const rangeName = asNonEmptyString(riskScore.range_name);
	const riskLevel = rangeName
		? RISK_LEVELS.find((level) => level.key === rangeName.toLowerCase())
		: undefined;

	const submitted = [
		...sharedRequestFields(input),
		computed("phone_number", "Phone Number", inputSection.phone_number, {
			mono: true,
		}),
		computed(
			"profile",
			"Risk Profile",
			profile?.title ?? (riskReference ? "Unknown profile" : undefined),
		),
		computed("risk_reference", "Profile Reference", riskReference, {
			mono: true,
		}),
		computed(
			"profile_environment",
			"Profile Environment",
			profile ? (profile.mode === "test" ? "Test" : "Live") : undefined,
		),
		computed(
			"profile_description",
			"Profile Description",
			profile?.description,
			{
				wide: true,
			},
		),
	];

	const scores = [
		computed(
			"total_assessment_score",
			"Total Score",
			scoreValue(riskScore.total_assessment_score),
		),
		computed(
			"questionnaire_score",
			"Questionnaire Score",
			scoreValue(riskScore.questionnaire_score),
		),
		computed(
			"fraud_prevention_score",
			"Fraud Prevention Score",
			scoreValue(riskScore.fraud_prevention_score),
		),
	];

	const services = records(assessment.services).flatMap((service, index) => {
		const name = asNonEmptyString(service.service_name);
		if (!name) return [];
		return [
			{
				key: `${name}-${index}`,
				name: formatHumanLabel(name),
				status: asNonEmptyString(service.status) ?? "unknown",
			},
		];
	});

	const outcome = buildProviderOutcome(response);
	const additional = [
		computed(
			"provider_customer_id",
			"Provider Customer ID",
			outcome.providerCustomerId,
			{ mono: true },
		),
		...leftoverFields(input, KNOWN_INPUT_KEYS, "input"),
		...leftoverFields(
			inputSection,
			new Set(["phone_number", "risk_reference"]),
			"input.risk_assessment",
		),
		...leftoverFields(assessment, KNOWN_ASSESSMENT_KEYS, "risk_assessment"),
		...leftoverFields(riskScore, KNOWN_SCORE_KEYS, "risk_score"),
		...leftoverFields(response, new Set(SHARED_RESPONSE_KEYS), "response"),
	];

	const questionnaire = questionnaireGroups(assessment.questionnaire);
	const visibleScores = withoutEmpty(scores);

	return {
		submitted: withoutEmpty(submitted),
		outcome,
		checks:
			results.risk_assessment === undefined
				? []
				: [
						{
							key: "risk_assessment",
							label: "Risk Assessment",
							value: results.risk_assessment,
						},
					],
		assessmentTitle: asNonEmptyString(assessment.title),
		riskLevel,
		rangeName,
		scores: visibleScores,
		services,
		questionnaire,
		additional: withoutEmpty(additional),
		hasResult:
			Boolean(rangeName) ||
			visibleScores.length > 0 ||
			questionnaire.length > 0,
	};
}
