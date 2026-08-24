import { type KycSection, SECTION_NAMES } from "../-data";
import { AuthorizedSignatureForm } from "./authorized-signature-form";
import { BasicInformationForm } from "./basic-information-form";
import { BusinessActivityForm } from "./business-activity-form";
import { ComplianceDeclarationsForm } from "./compliance-declarations-form";
import { DirectorsAndShareholdersForm } from "./directors-and-shareholders-form";
import { DocumentsUploadForm } from "./documents-upload-form";
import { OnboardingQuestionnaireForm } from "./onboarding-questionnaire-form";
import { PrimaryContactForm } from "./primary-contact-form";

const SECTION_FORMS = {
	[SECTION_NAMES.BASIC_INFORMATION]: BasicInformationForm,
	[SECTION_NAMES.PRIMARY_CONTACT]: PrimaryContactForm,
	[SECTION_NAMES.DIRECTORS_AND_SHAREHOLDERS]: DirectorsAndShareholdersForm,
	[SECTION_NAMES.BUSINESS_ACTIVITY]: BusinessActivityForm,
	[SECTION_NAMES.ONBOARDING_QUESTIONNAIRE]: OnboardingQuestionnaireForm,
	[SECTION_NAMES.DOCUMENTS_UPLOAD]: DocumentsUploadForm,
	[SECTION_NAMES.COMPLIANCE_DECLARATIONS]: ComplianceDeclarationsForm,
	[SECTION_NAMES.AUTHORIZED_SIGNATURE]: AuthorizedSignatureForm,
} as const;

export function KycSectionContent({ section }: { section: KycSection }) {
	const FormComponent = SECTION_FORMS[section.path];

	return <FormComponent />;
}
