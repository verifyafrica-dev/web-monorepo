import type { InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { StatusCodes } from "http-status-codes";

import { deleteAllCookies, getCookie, setCookie } from "@verifyafrica/ui/lib/cookies";
import type { V2SuccessResponse } from "./shared";
import { configureHttpClient } from "./client";

export const AUTH_APP_HEADER = "X-Auth-App";
const REFRESH_TOKEN_ENDPOINT = "/v2/users/refresh-token/";

export type CreateHttpClientOptions = {
	baseURL: string;
	isDevelopment: boolean;
	authApp: string;
	getTokenPrefix: (host: string) => string;
	publicRouteFragments: string[];
	isPublicRoute?: (url: string) => boolean;
	onLogout: () => void;
};

export function createHttpClient(options: CreateHttpClientOptions) {
	const isBrowser = typeof window !== "undefined";
	const getAccessTokenKey = () =>
		`${options.getTokenPrefix(isBrowser ? window.location.host : "")}accessToken`;
	const expiresDays = options.isDevelopment ? 1 : 5 / 60 / 24;

	const getAccessToken = () => (isBrowser ? getCookie(getAccessTokenKey()) ?? "" : "");
	const setAccessToken = (accessToken: string) => {
		if (isBrowser) setCookie(getAccessTokenKey(), accessToken, expiresDays);
	};
	const setTokens = (
		accessToken: string,
		_refreshToken?: string,
		_options?: { rememberRefreshToken?: boolean },
	) => setAccessToken(accessToken);

	const clearTokensAndLogout = () => {
		if (!isBrowser) return;
		deleteAllCookies();
		options.onLogout();
	};

	const http = axios.create({
		baseURL: options.baseURL,
		timeout: 30000,
		headers: { "Content-Type": "application/json", [AUTH_APP_HEADER]: options.authApp },
		withCredentials: true,
	});

	const isPublicRoute = (url: string) =>
		options.isPublicRoute?.(url) || options.publicRouteFragments.some((route) => url.includes(route));
	const shouldUseAccessToken = (url: string) => !isPublicRoute(url);

	const refreshAccessToken = async () => {
		const response = await axios.post<V2SuccessResponse<{ access_token: string }>>(
			`${options.baseURL}${REFRESH_TOKEN_ENDPOINT}`,
			undefined,
			{ withCredentials: true, headers: { [AUTH_APP_HEADER]: options.authApp } },
		);
		return response.data.data.access_token;
	};

	let isRefreshing = false;
	let failedRequestsQueue: Array<{
		resolve: (value: unknown) => void;
		reject: (reason?: unknown) => void;
		config: InternalAxiosRequestConfig;
	}> = [];

	http.interceptors.request.use(async (config) => {
		const accessToken = getAccessToken();
		if (accessToken && shouldUseAccessToken(config.url ?? "")) {
			config.headers.Authorization = `Bearer ${accessToken}`;
		}
		return config;
	});

	http.interceptors.response.use(
		(response) => response,
		async (error) => {
			const originalRequest = error.config;
			const tokenExpired =
				error?.response?.status === StatusCodes.UNAUTHORIZED ||
				error?.response?.data?.code === "token_not_valid";

			if (tokenExpired && originalRequest && !originalRequest._retry && shouldUseAccessToken(originalRequest.url ?? "")) {
				originalRequest._retry = true;
				if (!isRefreshing) {
					isRefreshing = true;
					try {
						const accessToken = await refreshAccessToken();
						setAccessToken(accessToken);
						isRefreshing = false;
						failedRequestsQueue.forEach((request) => request.resolve(http(request.config)));
						failedRequestsQueue = [];
						return http(originalRequest);
					} catch (refreshError) {
						isRefreshing = false;
						clearTokensAndLogout();
						return Promise.reject(refreshError);
					}
				}

				return new Promise((resolve, reject) => {
					failedRequestsQueue.push({ resolve, reject, config: originalRequest });
				});
			}

			return Promise.reject(error);
		},
	);

	configureHttpClient(http);
	return { http, getAccessTokenKey, setAccessToken, setTokens };
}
