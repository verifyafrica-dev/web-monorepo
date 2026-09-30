export const NO_COUNTRIES_MESSAGE =
	"All countries have been disabled. Kindly contact the admin.";

export function NoCountriesNotice() {
	return <p className="text-sm text-muted-foreground">{NO_COUNTRIES_MESSAGE}</p>;
}
