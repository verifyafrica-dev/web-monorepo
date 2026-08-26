import { getAuthTokenPrefix } from "@verifyafrica/config/domains";
import { AUTH_APP_HEADER, createHttpClient } from "@verifyafrica/api-client/http/xhr";
import { useAuthStore } from "#/stores/auth-store";
import { env } from "../../config/env";

export const AUTH_APP = "dashboard" as const;

const { http, getAccessTokenKey, setAccessToken, setTokens } = createHttpClient({
	baseURL: env.apiBaseUrl,
	isDevelopment: env.isDevelopment,
	authApp: AUTH_APP,
	getTokenPrefix: getAuthTokenPrefix,
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
		"/v2/tenants/invitations/create-user/",
		"/v2/verifications/links/",
		"/v2/public/verifications/supported-countries/",
	],
	isPublicRoute: (url) => /\/v2\/verifications\/new-verify\/[^/?]+/.test(url),
	onLogout: () => useAuthStore.getState().clearAuth(),
});

export { AUTH_APP_HEADER, getAccessTokenKey, setAccessToken, setTokens };
export default http;
