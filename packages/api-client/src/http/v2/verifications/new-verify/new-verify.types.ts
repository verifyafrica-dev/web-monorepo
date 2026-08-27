import { z } from "zod";

import type { V2SuccessResponse } from "../../../shared";

export interface NewVerifyCollectConfig {
	dob: boolean;
	age: boolean;
	gender: boolean;
	backside_proof_required: boolean;
	verification_instructions: string;
}

export const ShuftiDocumentSupportedTypeSchema = z.enum([
	"id_card",
	"passport",
	"driving_license",
]);

export type ShuftiDocumentSupportedType = z.infer<
	typeof ShuftiDocumentSupportedTypeSchema
>;

export const NewVerifyIdDocumentFormBaseSchema = z.object({
	country: z.string().min(1, "Select a country"),
	documentType: z.string().min(1, "Select a document type"),
	dob: z.string(),
	age: z.string(),
	gender: z.string(),
});

export type NewVerifyIdDocumentFormValues = z.infer<
	typeof NewVerifyIdDocumentFormBaseSchema
>;

export const NEW_VERIFY_ID_DOCUMENT_FORM_DEFAULTS: NewVerifyIdDocumentFormValues =
	{
		country: "",
		documentType: "",
		dob: "",
		age: "",
		gender: "",
	};

export function createNewVerifyIdDocumentFormSchema(
	collect: Pick<NewVerifyCollectConfig, "dob" | "age" | "gender">,
) {
	return NewVerifyIdDocumentFormBaseSchema.extend({
		dob: collect.dob
			? z.string().min(1, "Date of birth is required")
			: z.string(),
		age: collect.age
			? z
					.string()
					.trim()
					.min(1, "Age is required")
					.refine((value) => {
						const age = Number(value);
						return Number.isInteger(age) && age >= 1 && age <= 150;
					}, "Enter a valid age")
			: z.string(),
		gender: collect.gender
			? z.string().min(1, "Select gender")
			: z.string(),
	});
}

export interface NewVerifySession {
	token: string;
	reference: string;
	email?: string;
	verification_type: string;
	ttl_minutes: number | null;
	expires_at: string | null;
	supported_types: ShuftiDocumentSupportedType[];
	collect: NewVerifyCollectConfig;
	allow_file_upload?: boolean;
}

export interface NewVerifyPresignPayload {
	file_name: string;
	content_type: string;
	file_size: number;
}

export interface NewVerifyPresignData {
	upload_url: string;
	storage_path: string;
	url: string;
	expires_in: number;
	headers: Record<string, string>;
}

export interface NewVerifyDocumentSubmitPayload {
	country: string;
	supported_types: ShuftiDocumentSupportedType;
	proof: string;
	additional_proof?: string | null;
	dob?: string | null;
	age?: string | null;
	gender?: string | null;
}

export interface NewVerifyDocumentSubmitData {
	reference: string;
	event: string | null;
	status: string;
}

export interface NewVerifyFeedbackSubmitPayload {
	email: string;
	message: string;
}

export interface NewVerifyFeedbackSubmitData {
	email: string;
}

export type NewVerifySessionResponse = V2SuccessResponse<NewVerifySession>;
export type NewVerifyPresignResponse = V2SuccessResponse<NewVerifyPresignData>;
export type NewVerifyDocumentSubmitResponse =
	V2SuccessResponse<NewVerifyDocumentSubmitData>;
export type NewVerifyFeedbackSubmitResponse =
	V2SuccessResponse<NewVerifyFeedbackSubmitData>;
