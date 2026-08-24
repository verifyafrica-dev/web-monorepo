const EMPTY_EDITOR_VALUES = new Set(["", "<p></p>", "<p><br></p>"]);

export function isRichTextEmpty(html: string | undefined | null): boolean {
	if (!html) return true;
	const normalized = html.trim();
	if (EMPTY_EDITOR_VALUES.has(normalized)) return true;

	if (typeof document !== "undefined") {
		const container = document.createElement("div");
		container.innerHTML = normalized;
		return (container.textContent?.trim().length ?? 0) === 0;
	}

	return normalized.replace(/<[^>]*>/g, "").trim().length === 0;
}

export function getRichTextPlainText(html: string): string {
	if (typeof document !== "undefined") {
		const container = document.createElement("div");
		container.innerHTML = html;
		return container.textContent?.trim() ?? "";
	}

	return html.replace(/<[^>]*>/g, "").trim();
}
