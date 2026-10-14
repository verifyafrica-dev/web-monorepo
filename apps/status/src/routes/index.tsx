import {
	CheckCircleIcon,
	WarningCircleIcon,
	WarningIcon,
	WrenchIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import type {
	ComponentStatus,
	IncidentStatus,
	StatusComponent,
	StatusHistoryDay,
	StatusIncident,
	StatusSummary,
} from "@verifyafrica/api-client/http/v2/status/status.types";
import {
	detectDeployEnvironment,
	getAppOrigin,
} from "@verifyafrica/config/domains";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@verifyafrica/ui/components/ui/tooltip";
import { cn } from "@verifyafrica/ui/lib/utils";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useStatusSummaryQuery } from "#/api/status";
import { env } from "#/config/env";

const MARKETING_SITE_URL = "https://verifyafrica.io";
const SUPPORT_EMAIL = "support@verifyafrica.io";
// Derived from the API URL rather than window.location so SSR and hydration agree.
const DASHBOARD_URL = getAppOrigin(
	detectDeployEnvironment(new URL(env.apiBaseUrl).host),
	"client",
);

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "System Status | VerifyAfrica" },
			{
				name: "description",
				content:
					"Live availability of the VerifyAfrica API, dashboard and verification products.",
			},
		],
	}),
	component: StatusPage,
});

const STATUS_META: Record<
	ComponentStatus,
	{ label: string; dot: string; bar: string; text: string; banner: string }
> = {
	operational: {
		label: "Operational",
		dot: "bg-emerald-500",
		bar: "bg-emerald-500",
		text: "text-emerald-700",
		banner: "bg-emerald-600",
	},
	degraded: {
		label: "Degraded performance",
		dot: "bg-amber-400",
		bar: "bg-amber-400",
		text: "text-amber-700",
		banner: "bg-amber-500",
	},
	partial_outage: {
		label: "Partial outage",
		dot: "bg-orange-500",
		bar: "bg-orange-500",
		text: "text-orange-700",
		banner: "bg-orange-600",
	},
	major_outage: {
		label: "Major outage",
		dot: "bg-red-500",
		bar: "bg-red-500",
		text: "text-red-700",
		banner: "bg-red-600",
	},
	maintenance: {
		label: "Under maintenance",
		dot: "bg-sky-500",
		bar: "bg-sky-500",
		text: "text-sky-700",
		banner: "bg-sky-600",
	},
};

const OVERALL_HEADLINE: Record<ComponentStatus, string> = {
	operational: "All systems operational",
	degraded: "Some systems are experiencing degraded performance",
	partial_outage: "Some systems are experiencing a partial outage",
	major_outage: "Some systems are experiencing a major outage",
	maintenance: "Scheduled maintenance in progress",
};

const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
	investigating: "Investigating",
	identified: "Identified",
	monitoring: "Monitoring",
	resolved: "Resolved",
};

const MOBILE_HISTORY_DAYS = 30;

function StatusIcon({
	status,
	className,
}: {
	status: ComponentStatus;
	className?: string;
}) {
	const props = { weight: "fill" as const, className };
	switch (status) {
		case "operational":
			return <CheckCircleIcon {...props} />;
		case "degraded":
			return <WarningIcon {...props} />;
		case "partial_outage":
			return <WarningCircleIcon {...props} />;
		case "major_outage":
			return <XCircleIcon {...props} />;
		case "maintenance":
			return <WrenchIcon {...props} />;
	}
}

function formatUptime(value: number | null) {
	if (value === null) return "No data";
	return `${value.toFixed(value === 100 ? 0 : 2)}% uptime`;
}

function HistoryBar({
	day,
	hiddenOnMobile,
}: {
	day: StatusHistoryDay;
	hiddenOnMobile: boolean;
}) {
	const meta = day.status ? STATUS_META[day.status] : null;
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					className={cn(
						"h-8 flex-1 rounded-[2px] transition-opacity hover:opacity-70",
						meta ? meta.bar : "bg-muted",
						hiddenOnMobile && "hidden md:block",
					)}
				/>
			</TooltipTrigger>
			<TooltipContent side="top" className="flex-col items-start gap-0.5">
				<span className="font-medium">
					{format(parseISO(day.date), "d MMM yyyy")}
				</span>
				<span>
					{meta ? meta.label : "No data"}
					{day.uptime !== null && ` · ${day.uptime.toFixed(2)}%`}
				</span>
			</TooltipContent>
		</Tooltip>
	);
}

function ComponentRow({ component }: { component: StatusComponent }) {
	const meta = STATUS_META[component.status];
	const firstMobileIndex = component.history.length - MOBILE_HISTORY_DAYS;
	return (
		<div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<p className="font-medium text-foreground">{component.name}</p>
					{component.description && (
						<p className="text-sm text-muted-foreground">
							{component.description}
						</p>
					)}
				</div>
				<span
					className={cn(
						"flex shrink-0 items-center gap-1.5 text-sm font-medium",
						meta.text,
					)}
				>
					<StatusIcon status={component.status} className="size-4" />
					{meta.label}
				</span>
			</div>
			<div className="flex gap-[2px]">
				{component.history.map((day, index) => (
					<HistoryBar
						key={day.date}
						day={day}
						hiddenOnMobile={index < firstMobileIndex}
					/>
				))}
			</div>
			<div className="flex justify-between text-xs text-muted-foreground tabular-nums">
				<span>
					<span className="md:hidden">{MOBILE_HISTORY_DAYS} days ago</span>
					<span className="hidden md:inline">
						{component.history.length} days ago
					</span>
				</span>
				<span>{formatUptime(component.uptime_percentage)}</span>
				<span>Today</span>
			</div>
		</div>
	);
}

function IncidentCard({
	incident,
	componentNames,
}: {
	incident: StatusIncident;
	componentNames: Map<string, string>;
}) {
	const meta = STATUS_META[incident.impact];
	const affected = incident.components
		.map((key) => componentNames.get(key))
		.filter(Boolean)
		.join(", ");
	return (
		<Card className="gap-0 py-0">
			<CardContent className="flex flex-col gap-3 p-5">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h3 className="font-semibold text-foreground">{incident.title}</h3>
					<span
						className={cn(
							"rounded-full px-2.5 py-0.5 text-xs font-medium",
							incident.status === "resolved"
								? "bg-emerald-50 text-emerald-700"
								: cn("bg-muted", meta.text),
						)}
					>
						{INCIDENT_STATUS_LABEL[incident.status]}
					</span>
				</div>
				{affected && (
					<p className="text-sm text-muted-foreground">Affects: {affected}</p>
				)}
				{incident.updates.length > 0 && (
					<ol className="flex flex-col gap-3 border-l pl-4">
						{incident.updates.map((update) => (
							<li key={update.created_at} className="text-sm">
								<p>
									<span className="font-medium">
										{INCIDENT_STATUS_LABEL[update.status]}
									</span>
									{" — "}
									{update.message}
								</p>
								<p className="text-xs text-muted-foreground">
									{format(parseISO(update.created_at), "d MMM yyyy, HH:mm")}
								</p>
							</li>
						))}
					</ol>
				)}
				<p className="text-xs text-muted-foreground">
					Started {format(parseISO(incident.started_at), "d MMM yyyy, HH:mm")}
					{incident.resolved_at &&
						` · Resolved ${format(parseISO(incident.resolved_at), "d MMM yyyy, HH:mm")}`}
				</p>
			</CardContent>
		</Card>
	);
}

function StatusContent({ summary }: { summary: StatusSummary }) {
	const overall = STATUS_META[summary.status];
	const componentNames = new Map(
		summary.components.map((component) => [component.key, component.name]),
	);
	const lastChecked = summary.last_checked_at ?? summary.updated_at;

	return (
		<div className="flex flex-col gap-8">
			<div
				className={cn(
					"flex items-center gap-3 rounded-xl px-5 py-4 text-white shadow-sm",
					overall.banner,
				)}
			>
				<StatusIcon status={summary.status} className="size-6 shrink-0" />
				<p className="text-lg font-semibold">
					{OVERALL_HEADLINE[summary.status]}
				</p>
			</div>

			{summary.is_stale && summary.last_checked_at && (
				<p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
					Status checks are delayed. The information below may be out of date.
				</p>
			)}

			{summary.active_incidents.length > 0 && (
				<section className="flex flex-col gap-3">
					<h2 className="text-lg font-semibold">Active incidents</h2>
					{summary.active_incidents.map((incident) => (
						<IncidentCard
							key={incident.id}
							incident={incident}
							componentNames={componentNames}
						/>
					))}
				</section>
			)}

			{summary.groups.map((group) => {
				const components = summary.components.filter(
					(component) => component.group === group.key,
				);
				if (components.length === 0) return null;
				return (
					<section key={group.key} className="flex flex-col gap-3">
						<h2 className="text-lg font-semibold">{group.name}</h2>
						<Card className="gap-0 py-0">
							<CardContent className="divide-y p-5">
								{components.map((component) => (
									<ComponentRow key={component.key} component={component} />
								))}
							</CardContent>
						</Card>
					</section>
				);
			})}

			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-semibold">Past incidents</h2>
				{summary.recent_incidents.length > 0 ? (
					summary.recent_incidents.map((incident) => (
						<IncidentCard
							key={incident.id}
							incident={incident}
							componentNames={componentNames}
						/>
					))
				) : (
					<p className="text-sm text-muted-foreground">
						No incidents reported in the last 14 days.
					</p>
				)}
			</section>

			<p className="text-center text-xs text-muted-foreground">
				Last checked{" "}
				{formatDistanceToNow(parseISO(lastChecked), { addSuffix: true })}.
				Refreshes automatically every minute.
			</p>
		</div>
	);
}

function StatusSkeleton() {
	return (
		<div className="flex flex-col gap-8">
			<Skeleton className="h-16 w-full rounded-xl" />
			{[0, 1, 2].map((index) => (
				<div key={index} className="flex flex-col gap-3">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-48 w-full rounded-xl" />
				</div>
			))}
		</div>
	);
}

function StatusPage() {
	const { data, isPending, isError, refetch } = useStatusSummaryQuery();

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:py-16">
			<header className="flex items-center justify-between gap-4">
				<a href={MARKETING_SITE_URL} className="flex items-center gap-3">
					<img
						src="/assets/brand/logo.svg"
						alt="VerifyAfrica"
						className="h-8 w-auto"
					/>
				</a>
				<div className="flex items-center gap-4 text-sm font-medium">
					<span className="text-muted-foreground">System Status</span>
					<a
						href={DASHBOARD_URL}
						className="text-primary underline-offset-4 hover:underline"
					>
						Dashboard
					</a>
				</div>
			</header>

			{isPending ? (
				<StatusSkeleton />
			) : isError || !data ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-3 py-10 text-center">
						<XCircleIcon weight="fill" className="size-10 text-red-500" />
						<p className="font-medium">We couldn't load the system status.</p>
						<p className="text-sm text-muted-foreground">
							This may itself indicate an outage. Please try again shortly or
							contact{" "}
							<a
								href={`mailto:${SUPPORT_EMAIL}`}
								className="font-medium text-foreground underline underline-offset-4"
							>
								{SUPPORT_EMAIL}
							</a>
							.
						</p>
						<button
							type="button"
							onClick={() => refetch()}
							className="text-sm font-medium text-primary underline-offset-4 hover:underline"
						>
							Retry
						</button>
					</CardContent>
				</Card>
			) : (
				<StatusContent summary={data} />
			)}
		</div>
	);
}
