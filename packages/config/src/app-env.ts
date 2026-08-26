import { getLocalApiBaseUrl } from "./domains";

export function resolveApiBaseUrl(options: {
	isViteDev: boolean;
	viteApiBaseUrl: string;
	devNetworkIp?: string;
}): string {
	if (options.isViteDev) {
		return getLocalApiBaseUrl(options.devNetworkIp ?? "127.0.0.1");
	}

	return options.viteApiBaseUrl;
}
