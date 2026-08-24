import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";

export * from "@verifyafrica/api-client/http/shared";

export const DEFAULT_API_ERROR_MESSAGE =
	"An error occurred. Kindly contact your admin.";

export function getV2ErrorMessage(
	error: unknown,
	fallback = DEFAULT_API_ERROR_MESSAGE,
) {
	const axiosError = error as V2AxiosError;
	const data = axiosError.response?.data;
	const firstError = data?.errors?.[0];

	if (firstError) {
		return firstError;
	}

	if (data?.message) {
		return data.message;
	}

	return fallback;
}

export function getV2FormErrors(
	error: unknown,
	fallback = DEFAULT_API_ERROR_MESSAGE,
) {
	return [{ message: getV2ErrorMessage(error, fallback) }];
}
