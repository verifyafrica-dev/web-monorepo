import { z } from "zod";

import type {
	TenantWebhook,
	TenantWebhookCreatePayload,
	TenantWebhookUpdatePayload,
	WebhookDeliveryStatus,
} from "#/api/http/v2/tenants/tenants.types";
import { pickChangedFields } from "#/lib/pick-changed-fields";

export const webhooksSearchSchema = z.object({
	tab: z.enum(["configuration", "deliveries"]).optional(),
});

export type WebhooksSearchParams = z.infer<typeof webhooksSearchSchema>;

export function mergeWebhooksSearchParams(
	current: WebhooksSearchParams,
	patch: Partial<WebhooksSearchParams>,
): WebhooksSearchParams {
	const nextTab = patch.tab ?? current.tab ?? "configuration";

	if (nextTab === "configuration") {
		return {};
	}

	return { tab: nextTab };
}

export const WEBHOOK_EVENTS_PAGE_SIZE = 20;

export type WebhookFormState = {
	url: string;
	is_active: boolean;
	use_auth: boolean;
};

export const EMPTY_WEBHOOK_FORM: WebhookFormState = {
	url: "",
	is_active: true,
	use_auth: true,
};

export function generateWebhookToken() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID().replaceAll("-", "");
	}

	return Array.from({ length: 48 }, () =>
		Math.floor(Math.random() * 16).toString(16),
	).join("");
}

export function getWebhookFormState(
	webhook?: TenantWebhook | null,
): WebhookFormState {
	if (!webhook) {
		return EMPTY_WEBHOOK_FORM;
	}

	return {
		url: webhook.url,
		is_active: webhook.is_active,
		use_auth: true,
	};
}

export function getWebhookCreatePayload(
	form: WebhookFormState,
): TenantWebhookCreatePayload {
	return {
		url: form.url.trim(),
		is_active: form.is_active,
		use_auth: true,
	};
}

export function getWebhookUpdatePayload(
	original: WebhookFormState,
	form: WebhookFormState,
): TenantWebhookUpdatePayload {
	const changes = pickChangedFields(original, form);

	if ("url" in changes && typeof changes.url === "string") {
		changes.url = changes.url.trim();
	}

	return changes;
}

export function getWebhookTokenPreview(token: string | undefined) {
	if (!token) {
		return "your_webhook_token";
	}

	return token.length > 20 ? `${token.slice(0, 20)}...` : token;
}

const apiKeyDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "numeric",
	minute: "2-digit",
});

export function formatApiKeyDate(value: string | null) {
	if (!value) {
		return "Never";
	}

	return apiKeyDateFormatter.format(new Date(value));
}

export function formatWebhookEventDate(value: string) {
	return apiKeyDateFormatter.format(new Date(value));
}

export function maskApiKey(key: string, isVisible: boolean) {
	if (isVisible) {
		return key;
	}

	const prefix = key.slice(0, 8);
	return `${prefix}${"•".repeat(Math.max(key.length - 8, 0))}`;
}

export function getApiKeyPreview(key: string | undefined) {
	if (!key) {
		return "your_api_key";
	}

	return key.length > 20 ? `${key.slice(0, 20)}...` : key;
}

export function getWebhookDeliveryStatusLabel(status: WebhookDeliveryStatus) {
	switch (status) {
		case "success":
			return "Success";
		case "failure":
			return "Failure";
		case "pending":
			return "Pending";
		default:
			return status;
	}
}

export function getWebhookDeliveryStatusClassName(
	status: WebhookDeliveryStatus,
) {
	switch (status) {
		case "success":
			return "border-emerald-200 bg-emerald-50 text-emerald-700";
		case "failure":
			return "border-red-200 bg-red-50 text-red-700";
		case "pending":
			return "border-amber-200 bg-amber-50 text-amber-700";
		default:
			return "border-muted bg-muted text-muted-foreground";
	}
}
