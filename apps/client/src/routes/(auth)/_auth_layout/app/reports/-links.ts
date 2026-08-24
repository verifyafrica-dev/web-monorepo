export const reportsLinks = {
	list: "/app/reports/" as const,
	detail: (id: string) => `/app/reports/${id}` as const,
	batchDetail: (batchId: string) => `/app/reports/batch/${batchId}` as const,
};
