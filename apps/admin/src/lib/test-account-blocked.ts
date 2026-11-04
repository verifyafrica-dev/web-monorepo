import type {
	V2AxiosError,
	V2ErrorResponse,
} from "@verifyafrica/api-client/http/shared";

export const TEST_ACCOUNT_BLOCKED_SUPPORT_EMAIL = "support@verifyafrica.io";

export const TEST_ACCOUNT_BLOCKED_TITLE = "Test account blocked";

export const TEST_ACCOUNT_BLOCKED_DESCRIPTION =
	"Your test account is currently blocked. Please reach out to support for help:";

export const TEST_ACCESS_REQUEST_TITLE = "Request a test account";

export const TEST_ACCESS_REQUEST_DESCRIPTION =
	"Test access is not enabled for your organization yet. Contact support to request a test account:";

const BLOCKED_ERROR_CODES = new Set([
	"account_disabled",
	"account_activation_period",
]);

const TEST_ACCESS_DISABLED_CODE = "test_access_disabled";

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

function isBlockedAuthStatus(
	error: unknown,
	data: V2ErrorResponse | undefined,
): boolean {
	const statusCode =
		data?.status_code ?? (error as V2AxiosError).response?.status;
	return statusCode === 401 || statusCode === 403;
}

/** True when Live→Test mint failed because test access was never enabled. */
export function isTestAccessDisabledError(error: unknown): boolean {
	const data = readErrorPayload(error);
	if (!data || !isBlockedAuthStatus(error, data)) return false;

	if (data.errors?.some((item) => String(item) === TEST_ACCESS_DISABLED_CODE)) {
		return true;
	}

	const haystack = [data.message, ...(data.errors ?? [])].join(" ");
	return /test access is not enabled|request a test account/i.test(haystack);
}

/** True when Test twin / account is disabled or restricted. */
export function isTestAccountBlockedError(error: unknown): boolean {
	if (isTestAccessDisabledError(error)) return false;

	const data = readErrorPayload(error);
	if (!data || !isBlockedAuthStatus(error, data)) return false;

	if (data.errors?.some((item) => BLOCKED_ERROR_CODES.has(String(item)))) {
		return true;
	}

	const haystack = [data.message, ...(data.errors ?? [])].join(" ");
	return BLOCKED_MESSAGE_PATTERN.test(haystack);
}
