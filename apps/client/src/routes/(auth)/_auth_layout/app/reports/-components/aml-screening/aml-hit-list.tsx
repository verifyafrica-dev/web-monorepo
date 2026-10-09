import { BuildingsIcon, UserIcon } from "@phosphor-icons/react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@verifyafrica/ui/components/ui/accordion";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { cn } from "@verifyafrica/ui/lib/utils";
import { useEffect, useMemo, useState } from "react";

import { formatHumanLabel } from "../../-utils";
import { ReportSectionCard } from "../report-sections";
import { AmlCategoryBadge, AmlScoreBadge } from "./aml-hit-badges";
import { AmlHitDetail } from "./aml-hit-detail";
import {
	type AmlCategoryCount,
	type AmlHit,
	type AmlRiskCategory,
	formatMatchType,
	formatScore,
} from "./aml-sections";

const PAGE_SIZE = 20;
const PDF_DETAILED_COUNT = 25;

function getHashHitKey() {
	if (typeof window === "undefined") return undefined;
	const hash = decodeURIComponent(window.location.hash.slice(1));
	return hash.startsWith("aml-hit-") ? hash : undefined;
}

/** Resolved against the report URL when the PDF link annotations are created. */
function getHitHref(hit: AmlHit) {
	return `#${hit.key}`;
}

function pluralize(count: number, noun: string) {
	return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function HitSummary({ hit }: { hit: AmlHit }) {
	const Icon = hit.entityType === "person" ? UserIcon : BuildingsIcon;
	const meta = [
		hit.entityType ? formatHumanLabel(hit.entityType) : null,
		hit.countries.join(", ") || null,
		hit.sources.length > 0 ? pluralize(hit.sources.length, "source") : null,
		hit.media.length > 0 ? pluralize(hit.media.length, "article") : null,
	].filter(Boolean);

	return (
		<div className="flex min-w-0 flex-1 items-start gap-3">
			<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
				<Icon className="size-5" />
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-2">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<p className="text-sm font-medium text-pretty">{hit.name}</p>
						<AmlScoreBadge score={hit.score} />
					</div>
					{meta.length > 0 ? (
						<p className="text-xs font-normal text-muted-foreground break-words">
							{meta.join(" · ")}
						</p>
					) : null}
				</div>
				{hit.categories.length > 0 ? (
					<div className="flex flex-wrap gap-1">
						{hit.categories.map((category) => (
							<AmlCategoryBadge key={category} category={category} />
						))}
					</div>
				) : null}
				{hit.matchTypes.length > 0 ? (
					<p className="text-xs font-normal text-muted-foreground">
						Matched on {hit.matchTypes.map(formatMatchType).join(", ")}
					</p>
				) : null}
			</div>
		</div>
	);
}

function CategoryFilter({
	total,
	categoryCounts,
	selected,
	onSelect,
}: {
	total: number;
	categoryCounts: AmlCategoryCount[];
	selected?: AmlRiskCategory;
	onSelect: (category?: AmlRiskCategory) => void;
}) {
	if (categoryCounts.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-2">
			<Button
				type="button"
				size="sm"
				variant={selected ? "outline" : "default"}
				className="cursor-pointer"
				onClick={() => onSelect(undefined)}
			>
				All · {total}
			</Button>
			{categoryCounts.map((entry) => (
				<Button
					key={entry.category}
					type="button"
					size="sm"
					variant={selected === entry.category ? "default" : "outline"}
					className="cursor-pointer"
					aria-pressed={selected === entry.category}
					onClick={() =>
						onSelect(selected === entry.category ? undefined : entry.category)
					}
				>
					{entry.label} · {entry.count}
				</Button>
			))}
		</div>
	);
}

function InteractiveHitList({
	hits,
	categoryCounts,
}: {
	hits: AmlHit[];
	categoryCounts: AmlCategoryCount[];
}) {
	const [category, setCategory] = useState<AmlRiskCategory>();
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const [openKeys, setOpenKeys] = useState<string[]>(() =>
		hits[0] ? [hits[0].key] : [],
	);

	const filtered = useMemo(
		() =>
			category ? hits.filter((hit) => hit.categories.includes(category)) : hits,
		[hits, category],
	);
	const visible = filtered.slice(0, visibleCount);

	const [scrollTarget, setScrollTarget] = useState<string>();

	// The hash is only readable on the client, so apply it after hydration.
	useEffect(() => {
		const hashKey = getHashHitKey();
		const index = hits.findIndex((hit) => hit.key === hashKey);
		if (index === -1 || !hashKey) return;
		setCategory(undefined);
		setVisibleCount((count) => Math.max(count, index + 1));
		setOpenKeys((keys) => [...new Set([...keys, hashKey])]);
		setScrollTarget(hashKey);
	}, [hits]);

	// Scroll once the linked match has been rendered.
	useEffect(() => {
		if (!scrollTarget) return;
		const frame = requestAnimationFrame(() => {
			document
				.getElementById(scrollTarget)
				?.scrollIntoView({ behavior: "smooth", block: "start" });
			setScrollTarget(undefined);
		});
		return () => cancelAnimationFrame(frame);
	}, [scrollTarget]);

	return (
		<div className="space-y-4">
			<CategoryFilter
				total={hits.length}
				categoryCounts={categoryCounts}
				selected={category}
				onSelect={(next) => {
					setCategory(next);
					setVisibleCount(PAGE_SIZE);
				}}
			/>
			<Accordion
				type="multiple"
				value={openKeys}
				onValueChange={setOpenKeys}
				className="gap-3"
			>
				{visible.map((hit) => (
					<AccordionItem
						key={hit.key}
						value={hit.key}
						id={hit.key}
						className="scroll-mt-6 rounded-lg border bg-card not-last:border-b data-open:border-primary/60"
					>
						<AccordionTrigger className="cursor-pointer gap-3 px-4 py-4 hover:bg-muted/40 hover:no-underline">
							<HitSummary hit={hit} />
						</AccordionTrigger>
						<AccordionContent className="border-t px-4 pt-4 [&_a]:no-underline [&_p:not(:last-child)]:mb-0">
							<AmlHitDetail hit={hit} />
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
			{filtered.length > visible.length ? (
				<div className="flex flex-col items-center gap-2">
					<p className="text-xs text-muted-foreground">
						Showing {visible.length} of {filtered.length} matches
					</p>
					<Button
						type="button"
						variant="outline"
						className="cursor-pointer"
						onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
					>
						Show {Math.min(PAGE_SIZE, filtered.length - visible.length)} more
					</Button>
				</div>
			) : null}
		</div>
	);
}

function PdfHitList({ hits }: { hits: AmlHit[] }) {
	const detailed = hits.slice(0, PDF_DETAILED_COUNT);
	const remaining = hits.slice(PDF_DETAILED_COUNT);

	return (
		<div className="space-y-3">
			{detailed.map((hit) => (
				<div key={hit.key} className="rounded-lg border bg-card">
					<div data-pdf-href={getHitHref(hit)} className="px-4 py-4">
						<HitSummary hit={hit} />
					</div>
					<div className="border-t px-4 py-4">
						<AmlHitDetail hit={hit} expanded />
					</div>
				</div>
			))}
			{remaining.length > 0 ? (
				<div className="space-y-3 pt-2">
					<p className="text-sm font-medium">
						Other Matches{" "}
						<span className="text-muted-foreground">({remaining.length})</span>
					</p>
					<p className="text-xs text-muted-foreground">
						Select a name to open its full profile in VerifyAfrica.
					</p>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Score</TableHead>
									<TableHead>Categories</TableHead>
									<TableHead>Countries</TableHead>
									<TableHead>Sources</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{remaining.map((hit) => (
									<TableRow key={hit.key}>
										<TableCell className="whitespace-normal">
											<a
												href={getHitHref(hit)}
												className="font-medium text-primary"
											>
												{hit.name}
											</a>
										</TableCell>
										<TableCell className="tabular-nums">
											{formatScore(hit.score) ?? "N/A"}
										</TableCell>
										<TableCell className="whitespace-normal">
											<div className="flex flex-wrap gap-1">
												{hit.categories.map((category) => (
													<AmlCategoryBadge
														key={category}
														category={category}
													/>
												))}
											</div>
										</TableCell>
										<TableCell className="whitespace-normal">
											{hit.countries.join(", ") || "N/A"}
										</TableCell>
										<TableCell className="tabular-nums">
											{hit.sources.length}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			) : null}
		</div>
	);
}

export function AmlHitList({
	hits,
	categoryCounts,
	variant = "interactive",
}: {
	hits: AmlHit[];
	categoryCounts: AmlCategoryCount[];
	variant?: "interactive" | "pdf";
}) {
	if (hits.length === 0) return null;

	return (
		<ReportSectionCard title={`Potential Matches (${hits.length})`}>
			<div className={cn(variant === "pdf" && "[&_a]:no-underline")}>
				{variant === "pdf" ? (
					<PdfHitList hits={hits} />
				) : (
					<InteractiveHitList hits={hits} categoryCounts={categoryCounts} />
				)}
			</div>
		</ReportSectionCard>
	);
}
