import { z } from "zod";

export const CustomMessageAudienceSchema = z.enum([
	"all_users",
	"selected_users",
]);

export type CustomMessageAudience = z.infer<typeof CustomMessageAudienceSchema>;

export const CustomMessageRequestSchema = z
	.object({
		subject: z.string().trim().min(1, "Subject is required").max(200),
		message: z.string().trim().min(1, "Message is required"),
		audience: CustomMessageAudienceSchema,
		recipient_emails: z.array(z.string().email("Enter a valid email")).default([]),
	})
	.superRefine((value, context) => {
		if (
			value.audience === "selected_users" &&
			value.recipient_emails.length === 0
		) {
			context.addIssue({
				code: "custom",
				path: ["recipient_emails"],
				message: "Select at least one recipient",
			});
		}
	});

export type CustomMessageRequestPayload = z.infer<
	typeof CustomMessageRequestSchema
>;

export const CustomMessageResultSchema = z.object({
	queued_count: z.number(),
	batch_count: z.number(),
	audience: CustomMessageAudienceSchema,
	recipient_emails: z.array(z.string()),
});

export type CustomMessageResult = z.infer<typeof CustomMessageResultSchema>;
