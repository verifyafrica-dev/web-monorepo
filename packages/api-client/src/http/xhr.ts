import type { InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { StatusCodes } from "http-status-codes";

import { deleteAllCookies, getCookie, setCookie } from "@verifyafrica/ui/lib/cookies";
import type { V2SuccessResponse } from "./shared";
import { configureHttpClient } from "./client";

export const AUTH_APP_HEADER = "X-Auth-App";
const REFRESH_TOKEN_ENDPOINT = "/v2/users/refresh-token/";

export type CreateHttpClientOptions = {
	/** Static base URL (legacy). Prefer `getBaseURL` when Live/Test switching is enabled. */
	baseURL?: string;
	getBaseURL?: () => string;
	isDevelopment: boolean;
	authApp: string;
	/** Host-derived cookie prefix for Live access tokens (legacy helper). */
	getTokenPrefix?: (host: string) => string;
	getAccessToken?: () => string;
	setAccessToken?: (accessToken: string) => void;
	/** Custom refresh / re-mint. Defaults to cookie refresh against the Live/base API. */
	refreshAccessToken?: () => Promise<string>;
	/** Base URL used for the default refresh-token call (Live API). */
	getRefreshBaseURL?: () => string;
	publicRouteFragments: string[];
	isPublicRoute?: (url: string) => boolean;
	onLogout: () => void;
};

export function createHttpClient(options: CreateHttpClientOptions) {
	const isBrowser = typeof window !== "undefined";
	const resolveBaseURL = () =>
		options.getBaseURL?.() ?? options.baseURL ?? "";
	const resolveRefreshBaseURL = () =>
		options.getRefreshBaseURL?.() ?? resolveBaseURL();

	const getAccessTokenKey = () =>
		`${options.getTokenPrefix?.(isBrowser ? window.location.host : "") ?? ""}accessToken`;

	const expiresDays = options.isDevelopment ? 1 : 5 / 60 / 24;

	const defaultGetAccessToken = () =>
		isBrowser ? (getCookie(getAccessTokenKey()) ?? "") : "";
	const defaultSetAccessToken = (accessToken: string) => {
		if (isBrowser) setCookie(getAccessTokenKey(), accessToken, expiresDays);
	};

	const getAccessToken = () =>
		options.getAccessToken?.() ?? defaultGetAccessToken();
	const setAccessToken = (accessToken: string) => {
		if (options.setAccessToken) {
			options.setAccessToken(accessToken);
			return;
		}
		defaultSetAccessToken(accessToken);
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

	const defaultRefreshAccessToken = async () => {
		const response = await axios.post<V2SuccessResponse<{ access_token: string }>>(
			`${resolveRefreshBaseURL()}${REFRESH_TOKEN_ENDPOINT}`,
			undefined,
			{ withCredentials: true, headers: { [AUTH_APP_HEADER]: options.authApp } },
		);
		return response.data.data.access_token;
	};

	const refreshAccessToken =
		options.refreshAccessToken ?? defaultRefreshAccessToken;

	const http = axios.create({
		baseURL: resolveBaseURL(),
		timeout: 30000,
		headers: { "Content-Type": "application/json", [AUTH_APP_HEADER]: options.authApp },
		withCredentials: true,
	});

	const isPublicRoute = (url: string) =>
		options.isPublicRoute?.(url) ||
		options.publicRouteFragments.some((route) => url.includes(route));
	const shouldUseAccessToken = (url: string) => !isPublicRoute(url);

	let isRefreshing = false;
	let failedRequestsQueue: Array<{
		resolve: (value: unknown) => void;
		reject: (reason?: unknown) => void;
		config: InternalAxiosRequestConfig;
	}> = [];

	http.interceptors.request.use(async (config) => {
		config.baseURL = resolveBaseURL();
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

			if (
				tokenExpired &&
				originalRequest &&
				!originalRequest._retry &&
				shouldUseAccessToken(originalRequest.url ?? "")
			) {
				originalRequest._retry = true;
				if (!isRefreshing) {
					isRefreshing = true;
					try {
						const accessToken = await refreshAccessToken();
						setAccessToken(accessToken);
						isRefreshing = false;
						failedRequestsQueue.forEach((request) =>
							request.resolve(http(request.config)),
						);
						failedRequestsQueue = [];
						return http(originalRequest);
					} catch (refreshError) {
						isRefreshing = false;
						failedRequestsQueue.forEach((request) =>
							request.reject(refreshError),
						);
						failedRequestsQueue = [];
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

	configureHttpClient(http);
	return { http, getAccessTokenKey, setAccessToken, setTokens, getAccessToken };
}
