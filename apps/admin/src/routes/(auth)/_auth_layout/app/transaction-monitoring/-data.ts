export const TM_EVENT_OPTIONS = [
	{ value: "transfer", label: "Transfer" },
	{ value: "payout", label: "Payout" },
	{ value: "wallet_funding", label: "Wallet funding" },
	{ value: "checkout", label: "Checkout" },
	{ value: "login", label: "Login" },
	{ value: "registration", label: "Registration" },
] as const;

export const TM_APP_LABELS: Record<string, string> = {
	web: "Web",
	mobile: "Mobile",
	api: "API",
};

export function titleCase(value: string) {
	return value
		.replace(/[_-]+/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatEventLabel(event: string | null | undefined) {
	if (!event) return "Any event";
	return (
		TM_EVENT_OPTIONS.find((option) => option.value === event)?.label ??
		titleCase(event)
	);
}

export function formatAppLabel(app: string | null | undefined) {
	if (!app) return "—";
	return TM_APP_LABELS[app] ?? titleCase(app);
}
