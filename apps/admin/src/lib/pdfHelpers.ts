import html2canvas from "html2canvas";
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

const PDF_SPACING_PX = 16;
const PDF_RESOLUTION = 2;
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
	},
): Promise<void> => {
	if (!targetRef.current) {
		throw new Error("Target element ref is null");
	}

	const clone = createPdfClone(targetRef.current);
	document.body.appendChild(clone);

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

		const canvas = await html2canvas(clone, {
			scale: PDF_RESOLUTION,
			width: contentWidth,
			height: contentHeight,
			useCORS: true,
			logging: false,
		});

		const marginMm = pxToMm(PDF_SPACING_PX);
		const imageWidthMm = cssPxToMm(contentWidth);
		const imageHeightMm = cssPxToMm(contentHeight);
		const pageWidthMm = imageWidthMm + marginMm * 2;
		const pageHeightMm = imageHeightMm + marginMm * 2;

		const pdf = new jsPDF({
			unit: "mm",
			format: [pageWidthMm, pageHeightMm],
			compress: true,
		});

		pdf.addImage(
			canvas.toDataURL("image/jpeg", 0.75),
			"JPEG",
			marginMm,
			marginMm,
			imageWidthMm,
			imageHeightMm,
		);

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
