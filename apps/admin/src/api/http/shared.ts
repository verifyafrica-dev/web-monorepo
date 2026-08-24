import type { AxiosError, AxiosResponse } from "axios";

export interface V2ErrorResponse {
	success: false;
	message: string;
	errors: string[];
	external_error: boolean;
	status_code: number;
}

export interface V2SuccessResponse<TData, TMeta = undefined> {
	success: true;
	message: string;
	data: TData;
	meta?: TMeta;
}

export interface V2Pagination {
	current_page: number;
	total_pages: number;
	total: number;
	per_page: number;
	from?: number;
	to?: number;
}

export interface V2PaginationMeta {
	pagination: V2Pagination;
}

export type V2PaginatedSuccessResponse<TItem> = V2SuccessResponse<
	TItem[],
	V2PaginationMeta
>;

export type V2MessageSuccessResponse = V2SuccessResponse<Record<string, never>>;

export type V2AxiosError = AxiosError<V2ErrorResponse>;

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

export const unwrapV2Data = <T>(response: AxiosResponse<V2SuccessResponse<T>>) =>
	response.data.data;

export const unwrapV2Paginated = <T>(
	response: AxiosResponse<V2PaginatedSuccessResponse<T>>,
) => {
	const meta = response.data.meta;
	if (!meta) {
		throw new Error("Paginated API response is missing meta.");
	}

	return {
		items: response.data.data,
		meta,
		message: response.data.message,
	};
};

export const unwrapV2Message = (
	response: AxiosResponse<V2MessageSuccessResponse>,
) => response.data.message;
