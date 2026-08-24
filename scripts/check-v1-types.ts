import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, normalize, relative, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const writeChanges = process.argv.includes("--write");
const apps = ["admin", "client"];

type SymbolReference = { name: string; typeOnly: boolean };
type Reference = { file: string; symbols: SymbolReference[] };

function sourceFiles(directory: string): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
		const path = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...sourceFiles(path));
		else if ([".ts", ".tsx"].includes(extname(entry.name))) files.push(path);
	}
	return files;
}

function resolveModule(from: string, specifier: string, appRoot: string): string | undefined {
	if (specifier.startsWith("#/")) return resolve(appRoot, "src", specifier.slice(2));
	if (specifier.startsWith("@verifyafrica/api-client/")) {
		return resolve(root, "packages/api-client/src", specifier.slice("@verifyafrica/api-client/".length));
	}
	if (!specifier.startsWith(".")) return undefined;
	return resolve(dirname(from), specifier);
}

function existingModule(path: string): string | undefined {
	if (!path) return undefined;
	for (const candidate of [path, `${path}.ts`, `${path}.tsx`, join(path, "index.ts")]) {
		if (existsSync(candidate)) return normalize(candidate);
	}
	return undefined;
}

function importedSymbols(clause: string, importTypeOnly: boolean): SymbolReference[] {
	const named = clause.match(/\{([\s\S]*)\}/)?.[1];
	if (!named) return [];
	return named.split(",").map((item) => item.trim()).filter(Boolean).map((item) => {
		const typeOnly = importTypeOnly || /^type\b/.test(item);
		const name = item.replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
		return { name, typeOnly };
	});
}

function exportKinds(contents: string): Map<string, boolean> {
	const kinds = new Map<string, boolean>();
	for (const match of contents.matchAll(/export\s+(type\s+|interface\s+|const\s+|function\s+|class\s+)?([A-Za-z_$][\w$]*)/g)) {
		kinds.set(match[2], match[1]?.trim() === "type" || match[1]?.trim() === "interface");
	}
	return kinds;
}

function exportedNames(contents: string): Set<string> {
	const names = new Set<string>();
	for (const match of contents.matchAll(/export\s+(?:type\s+)?\{([\s\S]*?)\}\s*(?:from\s+["'][^"']+["'])?\s*;?/g)) {
		for (const item of match[1].split(",")) {
			const name = item.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
			if (name) names.add(name);
		}
	}
	for (const match of contents.matchAll(/export\s+(?:type\s+|interface\s+|const\s+|function\s+|class\s+)([A-Za-z_$][\w$]*)/g)) names.add(match[1]);
	return names;
}

function findReferences(target: string, files: string[], appRoot: string): Reference[] {
	const references: Reference[] = [];
	for (const file of files) {
		if (normalize(file) === normalize(target)) continue;
		const contents = readFileSync(file, "utf8");
		const pattern = /(?:import\s+(type\s+)?([\s\S]*?)\s+from\s+|export\s+(type\s+)?([\s\S]*?)\s+from\s+|import\s*\()(["'])([^"']+)\5/g;
		for (const match of contents.matchAll(pattern)) {
			const specifier = match[6];
			const resolved = existingModule(resolveModule(file, specifier, appRoot) ?? "");
			if (resolved !== normalize(target)) continue;
			const clause = match[2] ?? match[3] ?? "";
			const importTypeOnly = Boolean(match[1] || match[3]);
			references.push({ file, symbols: importedSymbols(clause, importTypeOnly) });
		}
	}
	return references;
}

function appendReexports(v1File: string, v2File: string, sourceSpecifier: string, symbols: SymbolReference[]) {
	if (!symbols.length || !existsSync(v2File)) return;
	const contents = readFileSync(v2File, "utf8");
	const alreadyExported = exportedNames(contents);
	const kinds = exportKinds(readFileSync(v1File, "utf8"));
	const values = [...new Set(symbols.filter((symbol) => !symbol.typeOnly && !alreadyExported.has(symbol.name) && !kinds.get(symbol.name)).map((symbol) => symbol.name))];
	const types = [...new Set(symbols.filter((symbol) => !alreadyExported.has(symbol.name) && (symbol.typeOnly || kinds.get(symbol.name))).map((symbol) => symbol.name))];
	if (!values.length && !types.length) return;
	const block = ["", "// References still consumed from the v1 types module."];
	if (values.length) block.push(`export { ${values.join(", ")} } from "${sourceSpecifier}";`);
	if (types.length) block.push(`export type { ${types.join(", ")} } from "${sourceSpecifier}";`);
	writeFileSync(v2File, `${contents.trimEnd()}\n${block.join("\n")}\n`);
}

let missingV2 = 0;
for (const app of apps) {
	const appRoot = resolve(root, "apps", app);
	const files = sourceFiles(resolve(appRoot, "src"));
	const v1Files = files.filter((file) => /[/\\]api[/\\]http[/\\]v1[/\\].+\.types\.ts$/.test(file));
	console.log(`\n${app}:`);
	for (const v1File of v1Files) {
		const relativeV1 = relative(resolve(appRoot, "src/api/http/v1"), v1File).replace(/\\/g, "/");
		const domain = relativeV1.split("/")[0];
		const sourceSpecifier = `#/api/http/v1/${relativeV1.replace(/\.ts$/, "")}`;
		const references = findReferences(v1File, files, appRoot);
		console.log(`- ${sourceSpecifier}: ${references.length} reference(s)`);
		for (const reference of references) {
			const names = reference.symbols.map((symbol) => symbol.name).join(", ") || "module";
			console.log(`  ${relative(root, reference.file)} (${names})`);
		}
		const v2File = resolve(appRoot, "src/api/http/v2", domain, `${domain}.types.ts`);
		if (writeChanges) appendReexports(v1File, v2File, sourceSpecifier, references.flatMap((reference) => reference.symbols));
		if (!existsSync(v2File) && references.length) missingV2++;
	}
}

if (missingV2) {
	console.warn(`\n${missingV2} referenced v1 module(s) have no corresponding v2 types file; no re-export was added.`);
}
