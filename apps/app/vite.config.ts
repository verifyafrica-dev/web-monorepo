import { PORTLESS_HOSTS } from "@verifyafrica/config/domains";
import { devNetworkViteDefine } from "@verifyafrica/config/network";
import path from "node:path";
// import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	define: devNetworkViteDefine(import.meta.dirname),
	server: {
		allowedHosts: [PORTLESS_HOSTS.app],
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
