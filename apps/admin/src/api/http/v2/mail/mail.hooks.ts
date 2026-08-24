import { useMutation } from "@tanstack/react-query";
import { MAIL_V2_API } from "./mail.api";
import type { CustomMessageRequestPayload } from "./mail.types";

export const useSendCustomMessageV2Mutation = () => {
	return useMutation({
		mutationFn: (payload: CustomMessageRequestPayload) =>
			MAIL_V2_API.SEND_CUSTOM_MESSAGE(payload),
	});
};
