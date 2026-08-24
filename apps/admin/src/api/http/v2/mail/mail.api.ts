import { unwrapV2Data } from "@verifyafrica/api-client/http/shared";
import $http from "../../xhr";
import type {
	CustomMessageRequestPayload,
	CustomMessageResult,
} from "./mail.types";

const MAIL_V2_ENDPOINTS = {
	customMessage: "/v2/mail/custom-message/",
} as const;

export const MAIL_V2_API = {
	SEND_CUSTOM_MESSAGE: async (
		data: CustomMessageRequestPayload,
	): Promise<CustomMessageResult> =>
		await $http
			.post(MAIL_V2_ENDPOINTS.customMessage, data)
			.then((res) => unwrapV2Data<CustomMessageResult>(res)),
};
