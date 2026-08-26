import { PORTLESS_HOSTS } from "@verifyafrica/config/domains";
import os from "node:os";
import path from "node:path";
// import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

function getNetworkIPv4() {
	for (const addrs of Object.values(os.networkInterfaces())) {
		for (const addr of addrs ?? []) {
			const isIPv4 = addr.family === "IPv4" || addr.family === 4;
			if (isIPv4 && !addr.internal) {
				return addr.address;
			}
		}
	}
	return "127.0.0.1";
}

process.env.VITE_DEV_NETWORK_IP ??= getNetworkIPv4();

const config = defineConfig({
	server: {
		allowedHosts: [PORTLESS_HOSTS.client],
	},
	resolve: {
		tsconfigPaths: true,
		alias: [
			{
				find: /^country-state-city$/,
				replacement: path.resolve(
					import.meta.dirname,
					"../../packages/ui/src/lib/country-state-city.ts",
				),
			},
			{
				find: "html2canvas",
				replacement: "html2canvas-pro",
			},
		],
	},
	optimizeDeps: {
		include: ["html2canvas-pro"],
	},
	plugins: [
		devtools(),
		nitro(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		// babel({ presets: [reactCompilerPreset()] }),
	],
});

export default config;
