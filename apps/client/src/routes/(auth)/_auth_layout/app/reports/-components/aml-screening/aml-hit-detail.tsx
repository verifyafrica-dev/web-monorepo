import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { type ReactNode, useState } from "react";

import { formatReportValue, ReportFieldGrid } from "../report-sections";
import {
	type AmlHit,
	type AmlMediaArticle,
	type AmlSource,
	formatAmlType,
} from "./aml-sections";

const PREVIEW_COUNTS = {
	aliases: 24,
	associates: 12,
	notes: 3,
	flags: 3,
	roles: 8,
	sources: 6,
	media: 5,
};

function DetailBlock({
	title,
	count,
	children,
}: {
	title: string;
	count?: number;
	children: ReactNode;
}) {
	return (
		<div className="space-y-3 border-t pt-4">
			<p className="text-sm font-medium">
				{title}
				{count !== undefined ? (
					<span className="text-muted-foreground"> ({count})</span>
				) : null}
			</p>
			{children}
		</div>
	);
}

function usePreview<T>(items: T[], previewCount: number, expanded: boolean) {
	const [showAll, setShowAll] = useState(false);
	const isTruncated = !expanded && !showAll && items.length > previewCount;
	const visible = isTruncated ? items.slice(0, previewCount) : items;
	const toggle =
		!expanded && items.length > previewCount ? (
			<Button
				type="button"
				variant="link"
				size="sm"
				className="h-auto cursor-pointer px-0"
				onClick={() => setShowAll((value) => !value)}
			>
				{showAll ? "Show less" : `Show all ${items.length}`}
			</Button>
		) : null;
	return { visible, toggle };
}

function ExternalLink({
	href,
	children,
}: {
	href: string;
	children: ReactNode;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
		>
			{children}
			<ArrowSquareOutIcon className="size-3.5 shrink-0" />
		</a>
	);
}

function TextList({
	title,
	items,
	previewCount,
	expanded,
}: {
	title: string;
	items: string[];
	previewCount: number;
	expanded: boolean;
}) {
	const { visible, toggle } = usePreview(items, previewCount, expanded);
	if (items.length === 0) return null;

	return (
		<DetailBlock title={title} count={items.length}>
			<ul className="space-y-2 text-sm text-pretty">
				{visible.map((item) => (
					<li
						key={item}
						className="rounded-md bg-muted/50 px-3 py-2 whitespace-pre-wrap break-words"
					>
						{item}
					</li>
				))}
			</ul>
			{toggle}
		</DetailBlock>
	);
}

function AliasList({ hit, expanded }: { hit: AmlHit; expanded: boolean }) {
	const { visible, toggle } = usePreview(
		hit.alternativeNames,
		PREVIEW_COUNTS.aliases,
		expanded,
	);
	if (hit.alternativeNames.length === 0) return null;

	return (
		<DetailBlock title="Also Known As" count={hit.alternativeNames.length}>
			<div className="flex flex-wrap gap-1">
				{visible.map((name) => (
					<Badge
						key={name}
						variant="outline"
						className="bg-muted/50 font-normal"
					>
						{name}
					</Badge>
				))}
			</div>
			{toggle}
		</DetailBlock>
	);
}

function AssociateList({ hit, expanded }: { hit: AmlHit; expanded: boolean }) {
	const { visible, toggle } = usePreview(
		hit.associates,
		PREVIEW_COUNTS.associates,
		expanded,
	);
	if (hit.associates.length === 0) return null;

	return (
		<DetailBlock
			title="Relatives & Close Associates"
			count={hit.associates.length}
		>
			<div className="grid gap-2 sm:grid-cols-2">
				{visible.map((associate) => (
					<div
						key={associate.key}
						className="flex min-w-0 flex-col rounded-md border px-3 py-2"
					>
						<span className="text-sm font-medium break-words">
							{associate.name}
						</span>
						{associate.association ? (
							<span className="text-xs text-muted-foreground">
								{associate.association}
							</span>
						) : null}
					</div>
				))}
			</div>
			{toggle}
		</DetailBlock>
	);
}

function RoleTable({ hit, expanded }: { hit: AmlHit; expanded: boolean }) {
	const { visible, toggle } = usePreview(
		hit.roles,
		PREVIEW_COUNTS.roles,
		expanded,
	);
	if (hit.roles.length === 0) return null;

	return (
		<DetailBlock title="Positions Held" count={hit.roles.length}>
			<div className="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Position</TableHead>
							<TableHead>Institution</TableHead>
							<TableHead>Tenure</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{visible.map((role) => (
							<TableRow key={role.key}>
								<TableCell className="whitespace-normal">
									{role.designation}
								</TableCell>
								<TableCell className="whitespace-normal">
									{formatReportValue(role.institution)}
								</TableCell>
								<TableCell className="whitespace-nowrap">
									{formatReportValue(role.tenure)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{toggle}
		</DetailBlock>
	);
}

function SourceItem({
	source,
	expanded,
}: {
	source: AmlSource;
	expanded: boolean;
}) {
	const dates = [
		source.listedAt
			? `Listed ${formatReportValue(source.listedAt, "date")}`
			: null,
		source.updatedAt && source.updatedAt !== source.listedAt
			? `Updated ${formatReportValue(source.updatedAt, "date")}`
			: null,
	].filter(Boolean);

	return (
		<li className="space-y-2 rounded-md border px-3 py-3">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<p className="min-w-0 text-sm font-medium text-pretty">
					{source.url ? (
						<ExternalLink href={source.url}>{source.name}</ExternalLink>
					) : (
						source.name
					)}
				</p>
				{source.types.length > 0 ? (
					<div className="flex flex-wrap gap-1">
						{source.types.map((type) => (
							<Badge key={type} variant="outline" className="font-normal">
								{formatAmlType(type)}
							</Badge>
						))}
					</div>
				) : null}
			</div>
			{source.countries.length > 0 || dates.length > 0 ? (
				<p className="text-xs text-muted-foreground">
					{[source.countries.join(", "), ...dates].filter(Boolean).join(" · ")}
				</p>
			) : null}
			{source.description && !expanded ? (
				<p className="line-clamp-2 text-xs text-muted-foreground text-pretty">
					{source.description}
				</p>
			) : null}
		</li>
	);
}

function SourceList({ hit, expanded }: { hit: AmlHit; expanded: boolean }) {
	const { visible, toggle } = usePreview(
		hit.sources,
		PREVIEW_COUNTS.sources,
		expanded,
	);
	if (hit.sources.length === 0) return null;

	return (
		<DetailBlock title="Listing Sources" count={hit.sources.length}>
			<ul className="space-y-2">
				{visible.map((source) => (
					<SourceItem key={source.key} source={source} expanded={expanded} />
				))}
			</ul>
			{toggle}
		</DetailBlock>
	);
}

function MediaItem({ article }: { article: AmlMediaArticle }) {
	return (
		<li className="space-y-1 rounded-md border px-3 py-3">
			<p className="text-sm font-medium text-pretty">
				{article.url ? (
					<ExternalLink href={article.url}>{article.title}</ExternalLink>
				) : (
					article.title
				)}
			</p>
			{article.date ? (
				<p className="text-xs text-muted-foreground">
					{formatReportValue(article.date, "date")}
				</p>
			) : null}
			{article.snippet ? (
				<p className="text-xs text-muted-foreground text-pretty">
					{article.snippet}
				</p>
			) : null}
			{article.keywords.length > 0 ? (
				<div className="flex flex-wrap gap-1 pt-1">
					{article.keywords.map((keyword) => (
						<Badge
							key={keyword}
							variant="outline"
							className="border-orange-200 bg-orange-50 font-normal text-orange-700"
						>
							{keyword}
						</Badge>
					))}
				</div>
			) : null}
		</li>
	);
}

function MediaList({ hit, expanded }: { hit: AmlHit; expanded: boolean }) {
	const { visible, toggle } = usePreview(
		hit.media,
		PREVIEW_COUNTS.media,
		expanded,
	);
	if (hit.media.length === 0) return null;

	return (
		<DetailBlock title="Adverse Media" count={hit.media.length}>
			<ul className="space-y-2">
				{visible.map((article) => (
					<MediaItem key={article.key} article={article} />
				))}
			</ul>
			{toggle}
		</DetailBlock>
	);
}

function HitImage({ src, alt }: { src: string; alt: string }) {
	const [failed, setFailed] = useState(false);
	if (failed) return null;

	return (
		<img
			src={`/api/image-proxy?url=${encodeURIComponent(src)}`}
			alt={alt}
			onError={() => setFailed(true)}
			className="size-24 shrink-0 rounded-md border object-cover"
		/>
	);
}

export function AmlHitDetail({
	hit,
	expanded = false,
}: {
	hit: AmlHit;
	expanded?: boolean;
}) {
	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
				{hit.imageUrl ? <HitImage src={hit.imageUrl} alt={hit.name} /> : null}
				<div className="flex min-w-0 flex-1 flex-col gap-4">
					{hit.originalName ? (
						<p className="text-sm text-muted-foreground">
							Listed as{" "}
							<span className="font-medium text-foreground">
								{hit.originalName}
							</span>
						</p>
					) : null}
					<ReportFieldGrid fields={hit.profile} />
					{hit.links.length > 0 ? (
						<div className="flex flex-wrap gap-4 text-sm">
							{hit.links.map((link) => (
								<ExternalLink key={link.key} href={link.url}>
									{link.label}
								</ExternalLink>
							))}
						</div>
					) : null}
				</div>
			</div>
			<TextList
				title="Listing Summary"
				items={hit.flagSummaries}
				previewCount={PREVIEW_COUNTS.flags}
				expanded={expanded}
			/>
			<RoleTable hit={hit} expanded={expanded} />
			<TextList
				title="Notes"
				items={hit.notes}
				previewCount={PREVIEW_COUNTS.notes}
				expanded={expanded}
			/>
			<SourceList hit={hit} expanded={expanded} />
			<MediaList hit={hit} expanded={expanded} />
			<AliasList hit={hit} expanded={expanded} />
			<AssociateList hit={hit} expanded={expanded} />
		</div>
	);
}
