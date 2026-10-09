import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

/**
 * Converts a CSS color string (including oklch/oklab) to rgb/rgba via canvas.
 */
const cssColorToRgb = (color: string): string | null => {
	if (!color || color === "transparent" || color === "none") {
		return null;
	}

	const canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return null;

	try {
		ctx.clearRect(0, 0, 1, 1);
		ctx.fillStyle = color;
		ctx.fillRect(0, 0, 1, 1);
		const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

		if (a === 0) return "transparent";
		if (a < 255) {
			return `rgba(${r}, ${g}, ${b}, ${Number((a / 255).toFixed(3))})`;
		}
		return `rgb(${r}, ${g}, ${b})`;
	} catch {
		return null;
	}
};

const MODERN_COLOR_PATTERN = /oklch|oklab/i;

const COLOR_PROPERTIES = [
	"color",
	"backgroundColor",
	"borderTopColor",
	"borderRightColor",
	"borderBottomColor",
	"borderLeftColor",
	"outlineColor",
	"textDecorationColor",
	"fill",
	"stroke",
] as const;

/**
 * Temporarily converts oklch/oklab colors to RGB for PDF generation
 * html2canvas (used by react-to-pdf) doesn't support modern color functions
 */
const convertModernColorsToRGB = (element: HTMLElement) => {
	const allElements = [
		element,
		...Array.from(element.querySelectorAll("*")),
	] as HTMLElement[];
	const originalStyles: Array<{
		element: HTMLElement;
		property: string;
		value: string;
	}> = [];

	allElements.forEach((el) => {
		const computedStyle = window.getComputedStyle(el);

		COLOR_PROPERTIES.forEach((property) => {
			const value = computedStyle[property];
			if (!value || !MODERN_COLOR_PATTERN.test(value)) return;

			originalStyles.push({
				element: el,
				property,
				value: el.style.getPropertyValue(
					property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`),
				),
			});

			const rgbValue = cssColorToRgb(value);
			if (!rgbValue) return;

			el.style.setProperty(
				property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`),
				rgbValue,
				"important",
			);
		});
	});

	return originalStyles;
};

/**
 * Restores original color styles after PDF generation
 */
const restoreOriginalStyles = (
	originalStyles: Array<{
		element: HTMLElement;
		property: string;
		value: string;
	}>,
) => {
	originalStyles.forEach(({ element, property, value }) => {
		if (value) {
			element.style.setProperty(property, value);
		} else {
			element.style.removeProperty(property);
		}
	});
};

const splitTopLevelCommas = (value: string) => {
	const parts: string[] = [];
	let depth = 0;
	let start = 0;
	for (let index = 0; index < value.length; index++) {
		const char = value[index];
		if (char === "(") depth++;
		else if (char === ")") depth--;
		else if (char === "," && depth === 0) {
			parts.push(value.slice(start, index).trim());
			start = index + 1;
		}
	}
	parts.push(value.slice(start).trim());
	return parts;
};

const RING_SHADOW_PATTERN =
	/^(?<color>.+?)\s+0px\s+0px\s+0px\s+(?<spread>[\d.]+)px$/;

/**
 * Tailwind rings are `0 0 0 Npx` box-shadows, which html2canvas does not draw,
 * so cards lose their outline. Swap them for an equivalent solid border.
 */
const convertRingsToBorders = (element: HTMLElement) => {
	for (const el of [element, ...Array.from(element.querySelectorAll("*"))]) {
		if (!(el instanceof HTMLElement)) continue;
		const style = window.getComputedStyle(el);
		if (style.boxShadow === "none" || Number.parseFloat(style.borderTopWidth))
			continue;

		const ring = splitTopLevelCommas(style.boxShadow)
			.map((shadow) => shadow.match(RING_SHADOW_PATTERN)?.groups)
			.find((groups) => groups && Number.parseFloat(groups.spread) > 0);
		if (!ring) continue;

		const color = cssColorToRgb(ring.color);
		if (!color || color === "transparent") continue;

		el.style.setProperty("box-shadow", "none", "important");
		el.style.setProperty(
			"border",
			`${ring.spread}px solid ${color}`,
			"important",
		);
	}
};

const PDF_SPACING_PX = 16;
const PDF_RESOLUTION = 2;
/** Browsers fail to render canvases taller than ~32k px, leaving the PDF blank. */
const MAX_CANVAS_DIMENSION_PX = 32_000;
/** Kept below the PDF spec's 14,400pt (19,200px) page limit and sharp at 2x scale. */
const MAX_PAGE_HEIGHT_PX = 14_000;
/** Page breaks snap to an element edge only within the bottom part of a page. */
const MIN_PAGE_FILL_RATIO = 0.6;
const MM_TO_PX = 96 / 25.4;

const pxToMm = (px: number) => (px / 96) * 25.4;
const cssPxToMm = (px: number) => px / MM_TO_PX;

const getElementClassName = (element: Element) =>
	element.getAttribute("class") ?? "";

const compactCloneForPdf = (clone: HTMLElement) => {
	clone.style.gap = "12px";

	for (const element of clone.querySelectorAll("*")) {
		const className = getElementClassName(element);
		if (!(element instanceof HTMLElement)) continue;

		if (className.includes("gap-6")) {
			element.style.gap = "12px";
		}
		if (className.includes("gap-4")) {
			element.style.gap = "8px";
		}
		if (className.includes("py-8")) {
			element.style.paddingTop = "16px";
			element.style.paddingBottom = "16px";
		}
		if (className.includes("py-2")) {
			element.style.paddingTop = "2px";
			element.style.paddingBottom = "2px";
		}
		if (className.includes("text-4xl")) {
			element.style.fontSize = "1.75rem";
			element.style.lineHeight = "2rem";
		}
	}
};

type PdfArea = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type PdfLinkArea = PdfArea & { url: string };

/** `targetY` is the CSS px offset of the destination element in the clone. */
type PdfInternalLinkArea = PdfArea & { targetY: number };

/** Space left above an internal link destination when the reader jumps to it. */
const INTERNAL_LINK_OFFSET_PX = 12;

const LINKABLE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

const toLinkableUrl = (href: string | null) => {
	if (!href) return null;
	try {
		const url = new URL(href, window.location.href);
		return LINKABLE_PROTOCOLS.has(url.protocol) ? url.toString() : null;
	} catch {
		return null;
	}
};

/**
 * Collects anchors and `data-pdf-href` elements so their areas can be made
 * clickable on top of the rasterised page. Positions are CSS px relative to the clone.
 */
const collectPdfLinkAreas = (clone: HTMLElement): PdfLinkArea[] => {
	const cloneRect = clone.getBoundingClientRect();
	const elements = clone.querySelectorAll<HTMLElement>(
		"a[href], [data-pdf-href]",
	);

	return Array.from(elements).flatMap((element) => {
		const url = toLinkableUrl(
			element.dataset.pdfHref ?? element.getAttribute("href"),
		);
		const rect = element.getBoundingClientRect();
		if (!url || rect.width === 0 || rect.height === 0) return [];
		return [
			{
				url,
				x: rect.left - cloneRect.left,
				y: rect.top - cloneRect.top,
				width: rect.width,
				height: rect.height,
			},
		];
	});
};

/**
 * Collects `data-pdf-target` elements, which jump to the element with that id
 * inside the same PDF.
 */
const collectPdfInternalLinkAreas = (
	clone: HTMLElement,
): PdfInternalLinkArea[] => {
	const cloneRect = clone.getBoundingClientRect();
	const elements = clone.querySelectorAll<HTMLElement>("[data-pdf-target]");

	return Array.from(elements).flatMap((element) => {
		const targetId = element.dataset.pdfTarget;
		const target = targetId
			? clone.querySelector(`[id="${CSS.escape(targetId)}"]`)
			: null;
		const rect = element.getBoundingClientRect();
		if (!target || rect.width === 0 || rect.height === 0) return [];
		return [
			{
				targetY: target.getBoundingClientRect().top - cloneRect.top,
				x: rect.left - cloneRect.left,
				y: rect.top - cloneRect.top,
				width: rect.width,
				height: rect.height,
			},
		];
	});
};

/**
 * Splits tall content into page slices that start at an element's top edge, so
 * breaks fall between lines and blocks rather than through text.
 */
const getPageSlices = (clone: HTMLElement, contentHeight: number) => {
	if (contentHeight <= MAX_PAGE_HEIGHT_PX) {
		return [{ offset: 0, height: contentHeight }];
	}

	const cloneTop = clone.getBoundingClientRect().top;
	const breakpoints = Array.from(
		new Set(
			Array.from(clone.querySelectorAll("*"), (element) =>
				Math.floor(element.getBoundingClientRect().top - cloneTop),
			),
		),
	).sort((a, b) => a - b);

	const slices: Array<{ offset: number; height: number }> = [];
	let offset = 0;
	while (offset < contentHeight) {
		const limit = offset + MAX_PAGE_HEIGHT_PX;
		if (limit >= contentHeight) {
			slices.push({ offset, height: contentHeight - offset });
			break;
		}
		const minimum = offset + MAX_PAGE_HEIGHT_PX * MIN_PAGE_FILL_RATIO;
		const end =
			breakpoints.filter((top) => top > minimum && top <= limit).pop() ?? limit;
		slices.push({ offset, height: end - offset });
		offset = end;
	}
	return slices;
};

const createPdfClone = (source: HTMLElement) => {
	const clone = source.cloneNode(true) as HTMLElement;
	const width = source.offsetWidth;

	clone.style.position = "fixed";
	clone.style.left = "-9999px";
	clone.style.top = "0";
	clone.style.width = `${width}px`;
	clone.style.maxWidth = `${width}px`;
	clone.style.height = "auto";
	clone.style.overflow = "hidden";
	clone.style.padding = `${PDF_SPACING_PX}px`;
	clone.style.boxSizing = "border-box";
	clone.style.display = "flex";
	clone.style.flexDirection = "column";
	clone.style.zIndex = "-1";

	for (const element of clone.querySelectorAll("[data-pdf-exclude]")) {
		element.remove();
	}
	for (const element of clone.querySelectorAll<HTMLElement>(
		"[data-pdf-only]",
	)) {
		element.hidden = false;
	}

	compactCloneForPdf(clone);

	return clone;
};

/**
 * Generates PDF with support for modern CSS color functions (oklch, oklab)
 *
 * @param targetRef - Ref to the element to convert to PDF
 * @param options - Configuration options for PDF generation
 * @returns Promise that resolves when PDF is generated
 *
 * @example
 * ```tsx
 * const contentRef = useRef<HTMLDivElement>(null);
 *
 * const handleDownload = async () => {
 *   await generatePDFWithColorSupport(contentRef, {
 *     filename: 'document.pdf'
 *   });
 * };
 * ```
 */
export const generatePDFWithColorSupport = async (
	targetRef: React.RefObject<HTMLElement | null>,
	options?: {
		filename?: string;
		onClone?: (clone: HTMLElement) => void;
	},
): Promise<void> => {
	if (!targetRef.current) {
		throw new Error("Target element ref is null");
	}

	const clone = createPdfClone(targetRef.current);
	options?.onClone?.(clone);
	document.body.appendChild(clone);
	convertRingsToBorders(clone);

	const contentWidth = clone.offsetWidth;
	const contentHeight = clone.scrollHeight;
	clone.style.height = `${contentHeight}px`;

	let originalStyles: Array<{
		element: HTMLElement;
		property: string;
		value: string;
	}> = [];

	try {
		originalStyles = convertModernColorsToRGB(clone);
		const linkAreas = collectPdfLinkAreas(clone);
		const internalLinkAreas = collectPdfInternalLinkAreas(clone);
		const slices = getPageSlices(clone, contentHeight);
		const firstChild = clone.firstElementChild as HTMLElement | null;
		const firstChildMarginTop = firstChild?.style.marginTop ?? "";

		const marginMm = pxToMm(PDF_SPACING_PX);
		const imageWidthMm = cssPxToMm(contentWidth);
		const pageWidthMm = imageWidthMm + marginMm * 2;
		let pdf: jsPDF | undefined;

		for (const slice of slices) {
			if (slices.length > 1) {
				// Shift the content up and crop the canvas to the slice. The clone
				// keeps its full height so flex children don't shrink and reflow;
				// the page margin replaces the clone padding on continuation pages.
				clone.style.paddingTop =
					slice.offset === 0 ? `${PDF_SPACING_PX}px` : "0";
				if (firstChild) {
					firstChild.style.marginTop =
						slice.offset === 0
							? firstChildMarginTop
							: `calc(${firstChildMarginTop || "0px"} - ${slice.offset - PDF_SPACING_PX}px)`;
				}
			}

			const canvas = await html2canvas(clone, {
				scale: Math.min(
					PDF_RESOLUTION,
					MAX_CANVAS_DIMENSION_PX / Math.max(contentWidth, slice.height),
				),
				width: contentWidth,
				height: slice.height,
				useCORS: true,
				logging: false,
			});

			const imageHeightMm = cssPxToMm(slice.height);
			const pageHeightMm = imageHeightMm + marginMm * 2;
			const pageFormat = [pageWidthMm, pageHeightMm];
			// jsPDF swaps the dimensions when they disagree with the orientation.
			const orientation = pageWidthMm > pageHeightMm ? "l" : "p";
			if (pdf) {
				pdf.addPage(pageFormat, orientation);
			} else {
				pdf = new jsPDF({
					unit: "mm",
					format: pageFormat,
					orientation,
					compress: true,
				});
			}

			pdf.addImage(
				canvas.toDataURL("image/jpeg", 0.75),
				"JPEG",
				marginMm,
				marginMm,
				imageWidthMm,
				imageHeightMm,
			);
			canvas.width = 0;
			canvas.height = 0;

			for (const area of linkAreas) {
				const top = area.y - slice.offset;
				if (top < 0 || top + area.height > slice.height) continue;
				pdf.link(
					marginMm + cssPxToMm(area.x),
					marginMm + cssPxToMm(top),
					cssPxToMm(area.width),
					cssPxToMm(area.height),
					{ url: area.url },
				);
			}
		}

		if (!pdf) return;

		if (internalLinkAreas.length > 0) {
			const pageHeightsMm = slices.map(
				(slice) => cssPxToMm(slice.height) + marginMm * 2,
			);
			const findSliceIndex = (y: number) =>
				slices.findIndex(
					(slice) => y >= slice.offset && y < slice.offset + slice.height,
				);
			const lastPage = slices.length;
			// jsPDF converts a destination's `top` using the height of the page
			// that is current when the file is written, so offset it for the
			// destination page's own height.
			const lastPageHeightMm = pageHeightsMm[lastPage - 1] ?? 0;

			for (const area of internalLinkAreas) {
				const sourceIndex = findSliceIndex(area.y);
				const source = slices[sourceIndex];
				const targetY = Math.max(0, area.targetY - INTERNAL_LINK_OFFSET_PX);
				const targetIndex = findSliceIndex(targetY);
				const target = slices[targetIndex];
				if (!source || !target) continue;
				const top = area.y - source.offset;
				if (top + area.height > source.height) continue;

				pdf.setPage(sourceIndex + 1);
				pdf.link(
					marginMm + cssPxToMm(area.x),
					marginMm + cssPxToMm(top),
					cssPxToMm(area.width),
					cssPxToMm(area.height),
					{
						pageNumber: targetIndex + 1,
						top:
							marginMm +
							cssPxToMm(targetY - target.offset) +
							lastPageHeightMm -
							(pageHeightsMm[targetIndex] ?? 0),
					},
				);
			}
			pdf.setPage(lastPage);
		}

		await pdf.save(options?.filename ?? "document.pdf", {
			returnPromise: true,
		});
	} finally {
		restoreOriginalStyles(originalStyles);
		document.body.removeChild(clone);
	}
};

/**
 * Alternative approach: Use browser's print dialog
 * This handles all modern CSS features correctly
 */
export const printToPDF = () => {
	window.print();
};
