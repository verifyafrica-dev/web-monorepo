import { ArrowDownIcon } from "@phosphor-icons/react";
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
import { type ReactNode, useMemo, useState } from "react";

import { ReportDetailField } from "../report-detail-field";
import { formatReportValue, ReportFieldGrid } from "../report-sections";
import {
	buildKybCompanyDetail,
	type KybAnnouncement,
	type KybCompanySummary,
	type KybContact,
	type KybOrgChartPerson,
	type KybTable,
} from "./kyb-screening-sections";

const ANNOUNCEMENT_PREVIEW_COUNT = 5;

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

function KybDataTable({ table }: { table: KybTable }) {
	return (
		<DetailBlock title={table.title} count={table.rows.length}>
			<div className="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							{table.columns.map((column) => (
								<TableHead key={column.key}>{column.label}</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{table.rows.map((row, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: provider rows have no stable id
							<TableRow key={index}>
								{table.columns.map((column) => (
									<TableCell key={column.key} className="whitespace-nowrap">
										{formatReportValue(row[column.key])}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</DetailBlock>
	);
}

function ContactValue({ contact }: { contact: KybContact }) {
	if (!contact.href) return contact.value;

	const isWeb = contact.href.startsWith("http");
	return (
		<a
			href={contact.href}
			target={isWeb ? "_blank" : undefined}
			rel={isWeb ? "noreferrer" : undefined}
			className="break-all text-primary underline-offset-4 hover:underline"
		>
			{contact.value}
		</a>
	);
}

function OrgChart({ levels }: { levels: KybOrgChartPerson[][] }) {
	return (
		<DetailBlock title="Organisation Chart">
			<div className="flex flex-col items-center gap-2">
				{levels.map((level, levelIndex) => (
					<div
						key={level.map((person) => person.name).join("|")}
						className="flex w-full flex-col items-center gap-2"
					>
						{levelIndex > 0 ? (
							<ArrowDownIcon className="size-4 text-muted-foreground" />
						) : null}
						<div className="flex flex-wrap justify-center gap-2">
							{level.map((person) => (
								<div
									key={`${person.name}-${person.designation ?? ""}`}
									className="min-w-40 rounded-md border bg-muted/30 px-3 py-2 text-center"
								>
									<p className="text-sm font-medium">{person.name}</p>
									{person.designation ? (
										<p className="text-xs text-muted-foreground">
											{person.designation}
										</p>
									) : null}
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</DetailBlock>
	);
}

function Announcements({
	items,
	expanded,
}: {
	items: KybAnnouncement[];
	expanded: boolean;
}) {
	const [showAll, setShowAll] = useState(expanded);
	const visible = showAll ? items : items.slice(0, ANNOUNCEMENT_PREVIEW_COUNT);

	return (
		<DetailBlock title="Announcements" count={items.length}>
			<ul className="divide-y rounded-md border">
				{visible.map((item) => (
					<li
						key={item.key}
						className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4"
					>
						<span className="shrink-0 text-xs text-muted-foreground tabular-nums sm:w-24">
							{item.date ?? "N/A"}
						</span>
						<div className="min-w-0 flex-1 space-y-1">
							{item.title ? (
								<Badge variant="outline" className="gap-1.5">
									{item.color ? (
										<span
											aria-hidden
											className="size-2 rounded-full"
											style={{ backgroundColor: item.color }}
										/>
									) : null}
									{item.title}
								</Badge>
							) : null}
							{item.description ? (
								<p className="text-sm text-pretty">{item.description}</p>
							) : null}
						</div>
					</li>
				))}
			</ul>
			{!expanded && items.length > ANNOUNCEMENT_PREVIEW_COUNT ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setShowAll((current) => !current)}
				>
					{showAll ? "Show fewer" : `Show all ${items.length} announcements`}
				</Button>
			) : null}
		</DetailBlock>
	);
}

export function KybCompanyDetail({
	company,
	expanded = false,
}: {
	company: KybCompanySummary;
	/** Renders everything without toggles, for the PDF export copy. */
	expanded?: boolean;
}) {
	const detail = useMemo(() => buildKybCompanyDetail(company), [company]);

	return (
		<div className="flex flex-col gap-4">
			<ReportFieldGrid fields={detail.overview} />

			{detail.description ? (
				<DetailBlock title="About">
					<p className="text-sm whitespace-pre-wrap text-pretty">
						{detail.description}
					</p>
				</DetailBlock>
			) : null}

			{detail.addresses.length > 0 ? (
				<DetailBlock title="Addresses">
					<ReportFieldGrid fields={detail.addresses} />
				</DetailBlock>
			) : null}

			{detail.contacts.length > 0 ? (
				<DetailBlock title="Contacts">
					<div className="grid gap-4 sm:grid-cols-2">
						{detail.contacts.map((contact) => (
							<ReportDetailField
								key={contact.key}
								label={contact.label}
								value={<ContactValue contact={contact} />}
							/>
						))}
					</div>
				</DetailBlock>
			) : null}

			{detail.orgChart.length > 0 ? (
				<OrgChart levels={detail.orgChart} />
			) : null}
			{detail.officers ? <KybDataTable table={detail.officers} /> : null}
			{detail.owners ? <KybDataTable table={detail.owners} /> : null}
			{detail.financials.map((table) => (
				<KybDataTable key={table.key} table={table} />
			))}
			{detail.announcements.length > 0 ? (
				<Announcements
					key={company.key}
					items={detail.announcements}
					expanded={expanded}
				/>
			) : null}

			{detail.additional.length > 0 ? (
				<DetailBlock title="Additional Details">
					<ReportFieldGrid fields={detail.additional} />
				</DetailBlock>
			) : null}
		</div>
	);
}
