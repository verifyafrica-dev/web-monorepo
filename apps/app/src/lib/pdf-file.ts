const LATIN1_DECODER = new TextDecoder("latin1");

/** PDF name `/Encrypt` followed by a real delimiter — not Unicode `\s`, which matches 0xA0 in image streams. */
const ENCRYPT_DICTIONARY_KEY = /\/Encrypt(?=[\0\t\n\f\r /[\]><}{(%]|$)/;

export function isPdfFile(file: Pick<File, "name" | "type">) {
	return (
		file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
	);
}

export function pdfBytesLookPasswordProtected(bytes: Uint8Array) {
	const text = LATIN1_DECODER.decode(bytes);

	for (const dictionary of collectPdfTrailerDictionaries(text)) {
		if (dictionaryHasEncryptKey(dictionary)) {
			return true;
		}
	}

	return false;
}

export async function isPasswordProtectedPdf(file: File) {
	if (!isPdfFile(file) || file.size === 0) {
		return false;
	}

	const bytes = new Uint8Array(await file.arrayBuffer());
	return pdfBytesLookPasswordProtected(bytes);
}

function dictionaryHasEncryptKey(dictionary: string) {
	return ENCRYPT_DICTIONARY_KEY.test(
		dictionary.replaceAll("/EncryptMetadata", ""),
	);
}

function collectPdfTrailerDictionaries(text: string) {
	const dictionaries: string[] = [];
	let cursor = 0;

	while (cursor < text.length) {
		const trailerIndex = text.indexOf("trailer", cursor);
		if (trailerIndex === -1) {
			break;
		}

		const dictionary = extractPdfDictionary(text, trailerIndex + "trailer".length);
		if (dictionary) {
			dictionaries.push(dictionary);
		}

		cursor = trailerIndex + "trailer".length;
	}

	const xrefStreamDictionary = extractXrefStreamDictionary(text);
	if (xrefStreamDictionary) {
		dictionaries.push(xrefStreamDictionary);
	}

	return dictionaries;
}

function extractXrefStreamDictionary(text: string) {
	const startxrefIndex = text.lastIndexOf("startxref");
	if (startxrefIndex === -1) {
		return null;
	}

	const offsetMatch = text
		.slice(startxrefIndex + "startxref".length)
		.match(/[\0\t\n\f\r ]*(\d+)/);
	if (!offsetMatch) {
		return null;
	}

	const offset = Number(offsetMatch[1]);
	if (!Number.isFinite(offset) || offset < 0 || offset >= text.length) {
		return null;
	}

	const objectChunk = text.slice(offset, Math.min(text.length, offset + 16_384));
	const objectIndex = objectChunk.search(/\d+[\0\t\n\f\r ]+\d+[\0\t\n\f\r ]+obj/);
	if (objectIndex === -1) {
		return null;
	}

	return extractPdfDictionary(objectChunk, objectIndex);
}

function extractPdfDictionary(text: string, fromIndex: number) {
	const start = text.indexOf("<<", fromIndex);
	if (start === -1) {
		return null;
	}

	let depth = 0;

	for (let index = start; index < text.length - 1; index += 1) {
		if (text[index] === "<" && text[index + 1] === "<") {
			depth += 1;
			index += 1;
			continue;
		}

		if (text[index] === ">" && text[index + 1] === ">") {
			depth -= 1;
			index += 1;
			if (depth === 0) {
				return text.slice(start, index + 1);
			}
		}
	}

	return null;
}
