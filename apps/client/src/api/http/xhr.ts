import axios from "axios";
import {
	getAuthTokenPrefix,
	getApiBaseUrlForMode,
} from "@verifyafrica/config/domains";
import { buildLoginRedirectUrl } from "@verifyafrica/ui/lib/redirect";
import { getCookie, setCookie } from "@verifyafrica/ui/lib/cookies";
import {
	AUTH_APP_HEADER,
	createHttpClient,
} from "@verifyafrica/api-client/http/xhr";
import type { V2SuccessResponse } from "@verifyafrica/api-client/http/shared";
import { useAuthStore } from "#/stores/auth-store";
import {
	apiModeConfig,
	useApiModeStore,
} from "#/stores/api-mode-store";
import { env } from "../../config/env";

export const AUTH_APP = "dashboard" as const;

const LIVE_ACCESS_TOKEN_KEY = () =>
	`${getAuthTokenPrefix(typeof window !== "undefined" ? window.location.host : "")}accessToken`;

const liveAccessExpiresDays = env.isDevelopment ? 1 : 5 / 60 / 24;

function getLiveAccessToken() {
	if (typeof window === "undefined") return "";
	return getCookie(LIVE_ACCESS_TOKEN_KEY()) ?? "";
}

function setLiveAccessToken(accessToken: string) {
	if (typeof window === "undefined") return;
	setCookie(LIVE_ACCESS_TOKEN_KEY(), accessToken, liveAccessExpiresDays);
}

async function mintTestAccessToken(): Promise<string> {
	const liveToken = getLiveAccessToken();
	if (!liveToken) {
		throw new Error("Missing live session. Please sign in again.");
	}

	const response = await axios.post<
		V2SuccessResponse<{ access_token: string }>
	>(`${apiModeConfig.liveApiBaseUrl}/v2/users/test-mode/access-token/`, undefined, {
		withCredentials: true,
		headers: {
			[AUTH_APP_HEADER]: AUTH_APP,
			Authorization: `Bearer ${liveToken}`,
		},
	});

	const token = response.data.data.access_token;
	if (!token) {
		throw new Error("Test mode access token was not returned.");
	}
	return token;
}

async function refreshAccessTokenForActiveMode(): Promise<string> {
	const mode = useApiModeStore.getState().mode;
	if (mode === "test") {
		const token = await mintTestAccessToken();
		useApiModeStore.getState().setTestAccessToken(token);
		return token;
	}

	const response = await axios.post<
		V2SuccessResponse<{ access_token: string }>
	>(`${apiModeConfig.liveApiBaseUrl}/v2/users/refresh-token/`, undefined, {
		withCredentials: true,
		headers: { [AUTH_APP_HEADER]: AUTH_APP },
	});
	return response.data.data.access_token;
}

const { http, getAccessTokenKey, setAccessToken, setTokens, getAccessToken } =
	createHttpClient({
		getBaseURL: () =>
			getApiBaseUrlForMode(useApiModeStore.getState().mode, apiModeConfig),
		getRefreshBaseURL: () => apiModeConfig.liveApiBaseUrl,
		isDevelopment: env.isDevelopment,
		authApp: AUTH_APP,
		getTokenPrefix: getAuthTokenPrefix,
		getAccessToken: () => {
			const mode = useApiModeStore.getState().mode;
			if (mode === "test") {
				return useApiModeStore.getState().testAccessToken ?? "";
			}
			return getLiveAccessToken();
		},
		setAccessToken: (accessToken) => {
			const mode = useApiModeStore.getState().mode;
			if (mode === "test") {
				useApiModeStore.getState().setTestAccessToken(accessToken);
				return;
			}
			setLiveAccessToken(accessToken);
			useAuthStore.getState().setAccessToken(accessToken);
		},
		refreshAccessToken: refreshAccessTokenForActiveMode,
		publicRouteFragments: [
			"/v2/users/register/",
			"/v2/users/login/",
			"/v2/users/lookup",
			"/v2/users/activate-account/",
			"/v2/users/forgot-password/",
			"/v2/users/verify-forgot-password-token/",
			"/v2/users/reset-password/",
			"/v2/users/refresh-token/",
			"/v2/users/resend-activation-code/",
			"/v2/tenants/verify-invitation/",
			"/v2/tenants/invitations/create-user/",
			"/v2/verifications/links/",
			"/v2/public/verifications/supported-countries/",
		],
		isPublicRoute: (url) => /\/v2\/verifications\/new-verify\/[^/?]+/.test(url),
		onLogout: () => {
			useApiModeStore.getState().clearTestSession();
			useApiModeStore.getState().setMode(apiModeConfig.defaultMode);
			useAuthStore.getState().clearAuth();
			window.location.href = buildLoginRedirectUrl(
				location.pathname + location.search + location.hash,
			);
		},
	});

export {
	AUTH_APP_HEADER,
	getAccessTokenKey,
	setAccessToken,
	setTokens,
	getAccessToken,
	mintTestAccessToken,
};
export default http;
