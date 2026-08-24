const DEFAULT_POST_LOGIN_PATH = "/app";
const LOGIN_PATH = "/login";

const AUTH_PATHS_WITHOUT_REDIRECT = new Set([
	"/login",
	"/register",
	"/forgot-password",
	"/reset-password",
	"/activate-account",
]);

export function getSafeRedirectPath(
	redirectTo: string | undefined,
): string | undefined {
	if (!redirectTo) {
		return undefined;
	}

	const trimmed = redirectTo.trim();

	if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
		return undefined;
	}

	if (trimmed.includes("://")) {
		return undefined;
	}

	return trimmed;
}

export function getPostLoginPath(redirectTo: string | undefined): string {
	return getSafeRedirectPath(redirectTo) ?? DEFAULT_POST_LOGIN_PATH;
}

export function buildLoginRedirectUrl(pathname: string): string {
	const safePath = getSafeRedirectPath(pathname);

	if (!safePath || AUTH_PATHS_WITHOUT_REDIRECT.has(safePath)) {
		return LOGIN_PATH;
	}

	const searchParams = new URLSearchParams();
	searchParams.set("redirect_to", safePath);

	return `${LOGIN_PATH}?${searchParams.toString()}`;
}
