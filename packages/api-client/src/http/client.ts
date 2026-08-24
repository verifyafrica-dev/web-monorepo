import type { AxiosInstance } from "axios";

let httpClient: AxiosInstance | null = null;

export function configureHttpClient(instance: AxiosInstance) {
	httpClient = instance;
}

export function getHttpClient(): AxiosInstance {
	if (!httpClient) {
		throw new Error(
			"@verifyafrica/api-client: HTTP client not configured. Call configureHttpClient() with your axios instance.",
		);
	}

	return httpClient;
}
