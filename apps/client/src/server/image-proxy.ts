import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { defineHandler } from "nitro/h3";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
/** SVG is excluded because it can carry scripts when opened directly. */
const ALLOWED_CONTENT_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/jpg",
	"image/gif",
	"image/webp",
	"image/avif",
	"image/bmp",
]);

function isPrivateAddress(address: string) {
	if (isIP(address) === 6) {
		const lower = address.toLowerCase();
		if (lower.startsWith("::ffff:")) return isPrivateAddress(lower.slice(7));
		return (
			lower === "::" ||
			lower === "::1" ||
			lower.startsWith("fc") ||
			lower.startsWith("fd") ||
			lower.startsWith("fe80")
		);
	}
	const [a = 0, b = 0] = address.split(".").map(Number);
	return (
		a === 0 ||
		a === 10 ||
		a === 127 ||
		(a === 100 && b >= 64 && b <= 127) ||
		(a === 169 && b === 254) ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 168) ||
		a >= 224
	);
}

async function assertPublicUrl(url: URL) {
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new Error("Unsupported protocol");
	}
	const hostname = url.hostname.replace(/^\[|\]$/g, "");
	const addresses = isIP(hostname)
		? [hostname]
		: (await lookup(hostname, { all: true })).map((entry) => entry.address);
	if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
		throw new Error("Blocked host");
	}
}

async function fetchPublicImage(initialUrl: URL, signal: AbortSignal) {
	let url = initialUrl;
	for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
		await assertPublicUrl(url);
		const response = await fetch(url, {
			redirect: "manual",
			signal,
			headers: { Accept: "image/*" },
		});
		const location = response.headers.get("location");
		if (response.status >= 300 && response.status < 400 && location) {
			url = new URL(location, url);
			continue;
		}
		return response;
	}
	throw new Error("Too many redirects");
}

function errorResponse(status: number) {
	return new Response(null, {
		status,
		headers: { "Cache-Control": "no-store" },
	});
}

/**
 * Serves third-party images (e.g. AML profile photos) from our origin, so plain
 * http URLs aren't blocked as mixed content and html2canvas can draw them in PDFs.
 *
 * Registered as a Nitro handler rather than a TanStack server route because
 * Nitro's dev server treats `Sec-Fetch-Dest: image` requests as static assets
 * unless a Nitro route matches.
 */
export default defineHandler(async (event) => {
	const target = event.url.searchParams.get("url");
	let url: URL;
	try {
		url = new URL(target ?? "");
	} catch {
		return errorResponse(400);
	}

	try {
		const response = await fetchPublicImage(
			url,
			AbortSignal.timeout(FETCH_TIMEOUT_MS),
		);
		const contentType = (response.headers.get("content-type") ?? "")
			.split(";")[0]
			.trim()
			.toLowerCase();
		const declaredLength = Number(response.headers.get("content-length"));
		if (
			!response.ok ||
			!ALLOWED_CONTENT_TYPES.has(contentType) ||
			declaredLength > MAX_IMAGE_BYTES
		) {
			return errorResponse(502);
		}

		const body = await response.arrayBuffer();
		if (body.byteLength > MAX_IMAGE_BYTES) {
			return errorResponse(502);
		}

		return new Response(body, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=86400",
				"Content-Security-Policy": "default-src 'none'; sandbox",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch {
		return errorResponse(502);
	}
});
