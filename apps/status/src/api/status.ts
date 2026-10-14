import { useQuery } from "@tanstack/react-query";
import { unwrapV2Data } from "@verifyafrica/api-client/http/shared";
import type { StatusSummary } from "@verifyafrica/api-client/http/v2/status/status.types";
import axios from "axios";
import { env } from "#/config/env";

const http = axios.create({ baseURL: env.apiBaseUrl, timeout: 15_000 });

const REFRESH_INTERVAL_MS = 60_000;

export const STATUS_QUERY_KEYS = {
	summary: ["status", "summary"] as const,
} as const;

export const fetchStatusSummary = async (): Promise<StatusSummary> =>
	await http.get("/v2/status/").then((res) => unwrapV2Data<StatusSummary>(res));

export const useStatusSummaryQuery = () =>
	useQuery({
		queryKey: STATUS_QUERY_KEYS.summary,
		queryFn: fetchStatusSummary,
		refetchInterval: REFRESH_INTERVAL_MS,
		refetchOnWindowFocus: true,
	});
