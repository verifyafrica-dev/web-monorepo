import type { InternalAxiosRequestConfig } from "axios";
import axios from "axios";

import { StatusCodes } from "http-status-codes";
import { deleteAllCookies, getCookie, setCookie } from "#/lib/cookies";
import { buildLoginRedirectUrl } from "#/lib/redirect";
import { useAuthStore } from "#/stores/auth-store";
import type { V2SuccessResponse } from "#/api/http/shared";
import { env } from "../../config/env";

const isBrowser = typeof window !== "undefined";

const getBrowserHost = () => (isBrowser ? window.location.host : "");

const getTokenPrefix = (): string => {
	const host = getBrowserHost();
	if (host.includes("localhost")) return "local:";
	if (host.includes("test.admin.verifyafrica.io")) return "test-admin:";
	if (host.includes("dashboard.verifyafrica.io")) return "dashboard:";
	if (host.includes("admin.verifyafrica.io")) return "admin:";
	return "local:";
};

/** App scope for the HttpOnly refresh cookie on the API host (`admin:refresh_token`). */
export const AUTH_APP = "admin" as const;
export const AUTH_APP_HEADER = "X-Auth-App";

export const getAccessTokenKey = (): string => `${getTokenPrefix()}accessToken`;
const ACCESS_TOKEN_COOKIE_EXPIRES_DAYS = env.isDevelopment
	? 1
	: 5 / 60 / 24; // 1 day in dev, 5 minutes in production
const REFRESH_TOKEN_ENDPOINT = "/v2/users/refresh-token/";

const getAccessToken = () => {
	if (!isBrowser) return "";

	return getCookie(getAccessTokenKey()) ?? "";
};

export const setAccessToken = (accessToken: string) => {
	if (!isBrowser) return;

	setCookie(getAccessTokenKey(), accessToken, ACCESS_TOKEN_COOKIE_EXPIRES_DAYS);
};

export const setTokens = (
	accessToken: string,
	_refreshToken?: string,
	_options?: { rememberRefreshToken?: boolean },
) => {
	setAccessToken(accessToken);
};

const clearTokensAndLogout = () => {
	if (!isBrowser) return;

	deleteAllCookies();
	useAuthStore.getState().clearAuth();
	window.location.href = buildLoginRedirectUrl(location.pathname);
};

const $http = axios.create({
	baseURL: env.apiBaseUrl,
	timeout: 30000,
	headers: {
		"Content-Type": "application/json",
		[AUTH_APP_HEADER]: AUTH_APP,
	},
	withCredentials: true,
});

let isRefreshing = false;
let failedRequestsQueue: Array<{
	resolve: (value: unknown) => void;
	reject: (reason?: unknown) => void;
	config: InternalAxiosRequestConfig;
}> = [];

// TODO: Get them from the api.ts files
const PUBLIC_ROUTE_FRAGMENTS = [
	"/v2/users/register/",
	"/v2/users/login/",
	"/v2/users/admin/login/",
	"/v2/users/lookup",
	"/v2/users/activate-account/",
	"/v2/users/forgot-password/",
	"/v2/users/verify-forgot-password-token/",
	"/v2/users/reset-password/",
	"/v2/users/refresh-token/",
	"/v2/users/resend-activation-code/",
	"/v2/tenants/invitations/create-user/",
	"/v2/verifications/links/",
];

const shouldUseAccessToken = (url: string) => {
	const matchFound = PUBLIC_ROUTE_FRAGMENTS.some((ignoredUrl) =>
		url.includes(ignoredUrl),
	);
	return !matchFound;
};

const refreshAccessToken = async () => {
	const response = await axios.post<
		V2SuccessResponse<{ access_token: string }>
	>(`${env.apiBaseUrl}${REFRESH_TOKEN_ENDPOINT}`, undefined, {
		withCredentials: true,
		headers: {
			[AUTH_APP_HEADER]: AUTH_APP,
		},
	});

	return response.data.data.access_token;
};

const isTokenExpiredError = (error: {
	response?: { status?: number; data?: { code?: string } };
}) => {
	return (
		error?.response?.status === StatusCodes.UNAUTHORIZED ||
		error?.response?.data?.code === "token_not_valid"
	);
};

$http.interceptors.request.use(
	async (config: InternalAxiosRequestConfig) => {
		const accessToken = getAccessToken();
		const requestUrl = config.url ?? "";

		if (accessToken && shouldUseAccessToken(requestUrl)) {
			config.headers.Authorization = `Bearer ${accessToken}`;
		}

		return config;
	},
	(error) => Promise.reject(error),
);

$http.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (
			isTokenExpiredError(error) &&
			originalRequest &&
			!originalRequest._retry &&
			shouldUseAccessToken(originalRequest.url as string)
		) {
			originalRequest._retry = true;

			if (!isRefreshing) {
				isRefreshing = true;
				try {
					const accessToken = await refreshAccessToken();
					setAccessToken(accessToken);

					isRefreshing = false;
					failedRequestsQueue.forEach((req) => {
						req.resolve($http(req.config));
					});
					failedRequestsQueue = [];
					return $http(originalRequest);
				} catch (refreshError) {
					isRefreshing = false;
					clearTokensAndLogout();
					return Promise.reject(refreshError);
				}
			}

			return new Promise((resolve, reject) => {
				failedRequestsQueue.push({
					resolve,
					reject,
					config: originalRequest,
				});
			});
		}

		return Promise.reject(error);
	},
);

export default $http;
