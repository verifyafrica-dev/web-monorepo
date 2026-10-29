import type { PresenceDeviceInfo } from "@verifyafrica/api-client/http/v2/presence/presence.types";

function detectBrowser(userAgent: string): string {
	if (/Edg\//.test(userAgent)) return "Edge";
	if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) return "Chrome";
	if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari";
	if (/Firefox\//.test(userAgent)) return "Firefox";
	return "Unknown";
}

function detectDeviceType(userAgent: string): string {
	if (/Mobi|Android|iPhone|iPad/i.test(userAgent)) return "mobile";
	return "desktop";
}

export function collectPresenceDeviceInfo(): PresenceDeviceInfo {
	if (typeof window === "undefined" || typeof navigator === "undefined") {
		return {
			user_agent: "",
			platform: "",
			browser: "",
			device_type: "unknown",
			screen: "",
			timezone: "",
			language: "",
		};
	}

	const userAgent = navigator.userAgent || "";
	return {
		user_agent: userAgent.slice(0, 500),
		platform: navigator.platform || "",
		browser: detectBrowser(userAgent),
		device_type: detectDeviceType(userAgent),
		screen:
			typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : "",
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
		language: navigator.language || "",
	};
}

export function createPresenceConnectionId(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `conn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
