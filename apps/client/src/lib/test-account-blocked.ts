import type { V2AxiosError, V2ErrorResponse } from "@verifyafrica/api-client/http/shared";

export const TEST_ACCOUNT_BLOCKED_SUPPORT_EMAIL = "support@verifyafrica.io";

export const TEST_ACCOUNT_BLOCKED_TITLE = "Test account blocked";

export const TEST_ACCOUNT_BLOCKED_DESCRIPTION =
	"Your test account is currently blocked. Please reach out to support for help:";

const BLOCKED_ERROR_CODES = new Set([
	"account_disabled",
	"account_activation_period",
]);

const BLOCKED_MESSAGE_PATTERN =
	/deactivated|not active|disabled|blocked|account_disabled|account_activation_period/i;

function readErrorPayload(error: unknown): V2ErrorResponse | undefined {
	const axiosError = error as V2AxiosError | undefined;
	const data = axiosError?.response?.data;
	if (data && typeof data === "object" && data.success === false) {
		return data;
	}
	return undefined;
}

/** True when Live→Test mint failed because the Test twin is disabled/restricted. */
export function isTestAccountBlockedError(error: unknown): boolean {
	const data = readErrorPayload(error);
	if (!data) return false;

	const statusCode = data.status_code ?? (error as V2AxiosError).response?.status;
	if (statusCode !== 403) return false;

	if (data.errors?.some((item) => BLOCKED_ERROR_CODES.has(String(item)))) {
		return true;
	}

	const haystack = [data.message, ...(data.errors ?? [])].join(" ");
	return BLOCKED_MESSAGE_PATTERN.test(haystack);
}
