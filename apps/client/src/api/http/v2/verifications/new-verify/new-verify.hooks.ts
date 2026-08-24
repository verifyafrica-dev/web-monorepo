import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import type {
	VerificationRequest,
	VerificationRequestCreatePayload,
} from "../verifications.types";
import { VERIFICATIONS_V2_QUERY_KEYS } from "../verifications.hooks";
import { NEW_VERIFY_V2_API } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.api";
import type {
	NewVerifyDocumentSubmitPayload,
	NewVerifyPresignPayload,
	NewVerifySession,
} from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";

const NEW_VERIFY_V2_STALE_TIME = 60_000;

export const NEW_VERIFY_V2_QUERY_KEYS = {
	all: ["verifications-v2", "new-verify"] as const,
	token: (token: string) =>
		["verifications-v2", "new-verify", token] as const,
} as const;

export const useNewVerifyTokenV2Query = (
	token: string | undefined,
	enabled = true,
): UseQueryResult<NewVerifySession> =>
	useQuery<NewVerifySession>({
		queryKey: NEW_VERIFY_V2_QUERY_KEYS.token(token ?? ""),
		queryFn: () => NEW_VERIFY_V2_API.TOKEN(token ?? ""),
		enabled: enabled && Boolean(token),
		staleTime: NEW_VERIFY_V2_STALE_TIME,
		retry: false,
	});

export const useCreateNewVerifyV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			tenantId,
			payload,
		}: {
			tenantId: string;
			payload: VerificationRequestCreatePayload;
		}) => NEW_VERIFY_V2_API.CREATE(tenantId, payload),
		onSuccess: (_data: VerificationRequest, { tenantId }) => {
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.tenantRequests(tenantId),
			});
		},
	});
};

export const useNewVerifyPresignV2Mutation = () =>
	useMutation({
		mutationFn: ({
			token,
			payload,
		}: {
			token: string;
			payload: NewVerifyPresignPayload;
		}) => NEW_VERIFY_V2_API.PRESIGN(token, payload),
	});

export const useSubmitNewVerifyDocumentV2Mutation = () =>
	useMutation({
		mutationFn: ({
			token,
			payload,
		}: {
			token: string;
			payload: NewVerifyDocumentSubmitPayload;
		}) => NEW_VERIFY_V2_API.DOCUMENT_VERIFICATION(token, payload),
	});
