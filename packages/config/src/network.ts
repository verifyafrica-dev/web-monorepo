import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function isIPv4(family: string | number): boolean {
	return family === "IPv4" || family === 4;
}

function isLinkLocal(address: string): boolean {
	return address.startsWith("169.254.");
}

function isPrivateIPv4(address: string): boolean {
	if (address.startsWith("192.168.")) {
		return true;
	}
	if (address.startsWith("10.")) {
		return true;
	}
	const [first, second] = address.split(".").map(Number);
	return first === 172 && second >= 16 && second <= 31;
}

function interfacePriority(name: string): number {
	if (/^en[0-9]+$/.test(name)) {
		return 4;
	}
	if (/^(wlan|eth)[0-9]+$/.test(name)) {
		return 3;
	}
	if (name.startsWith("bridge")) {
		return 0;
	}
	if (name.startsWith("utun") || name.startsWith("awdl") || name.startsWith("llw")) {
		return -2;
	}
	return 1;
}

type IPv4Candidate = {
	address: string;
	interfaceName: string;
};

/**
 * Best-effort LAN IPv4 for local dev (phone on same Wi‑Fi, etc.).
 * Skips link-local 169.254.x.x and prefers physical Wi‑Fi/Ethernet interfaces.
 */
export function getNetworkIPv4(): string {
	const candidates: IPv4Candidate[] = [];

	for (const [interfaceName, addrs] of Object.entries(os.networkInterfaces())) {
		for (const addr of addrs ?? []) {
			if (!isIPv4(addr.family) || addr.internal || isLinkLocal(addr.address)) {
				continue;
			}
			if (!isPrivateIPv4(addr.address)) {
				continue;
			}
			candidates.push({ address: addr.address, interfaceName });
		}
	}

	if (candidates.length === 0) {
		return "127.0.0.1";
	}

	candidates.sort((a, b) => {
		const priorityDiff =
			interfacePriority(b.interfaceName) - interfacePriority(a.interfaceName);
		if (priorityDiff !== 0) {
			return priorityDiff;
		}
		if (a.address.startsWith("192.168.") && !b.address.startsWith("192.168.")) {
			return -1;
		}
		if (!a.address.startsWith("192.168.") && b.address.startsWith("192.168.")) {
			return 1;
		}
		return a.address.localeCompare(b.address);
	});

	return candidates[0]?.address ?? "127.0.0.1";
}

/** Read a single key from a dotenv file without pulling in process.env. */
export function readDotenvValue(
	envFilePath: string,
	key: string,
): string | undefined {
	if (!fs.existsSync(envFilePath)) {
		return undefined;
	}

	const pattern = new RegExp(`^${key}\\s*=\\s*(.+)$`, "m");
	const match = fs.readFileSync(envFilePath, "utf8").match(pattern);
	if (!match?.[1]) {
		return undefined;
	}

	return match[1].trim().replace(/^["']|["']$/g, "");
}

/**
 * Resolve dev LAN IP for Vite apps.
 * Uses `.env` override when set; otherwise auto-detects each dev-server start.
 */
export function resolveDevNetworkIp(appDir: string): string {
	const fromEnvFile = readDotenvValue(path.join(appDir, ".env"), "VITE_DEV_NETWORK_IP");
	if (fromEnvFile) {
		return fromEnvFile;
	}

	return getNetworkIPv4();
}

/**
 * Inject VITE_DEV_NETWORK_IP for Vite client bundles.
 * Always overwrites stale shell/process values unless `.env` defines it.
 */
export function applyDevNetworkIp(appDir: string): string {
	const devNetworkIp = resolveDevNetworkIp(appDir);
	process.env.VITE_DEV_NETWORK_IP = devNetworkIp;
	return devNetworkIp;
}

/** Force the dev LAN IP into import.meta.env for Vite/TanStack Start. */
export function devNetworkViteDefine(appDir: string): Record<string, string> {
	const devNetworkIp = applyDevNetworkIp(appDir);
	console.log(`[vite] API dev host: ${devNetworkIp}:8300`);
	return {
		"import.meta.env.VITE_DEV_NETWORK_IP": JSON.stringify(devNetworkIp),
	};
}
