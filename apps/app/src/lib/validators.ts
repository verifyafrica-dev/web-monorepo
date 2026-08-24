export const isEmpty = (value: string): boolean => value.trim().length === 0;

export const isEmail = (value: string): boolean => {
	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	return emailRegex.test(value.trim());
};

export const PUBLIC_EMAIL_DOMAIN_ERROR_MESSAGE =
	"Please use your work email address.";

export const BLOCKED_register_EMAIL_DOMAINS = new Set([
	"aol.com",
	"fastmail.com",
	"gmail.com",
	"gmx.com",
	"googlemail.com",
	"hey.com",
	"hotmail.com",
	"icloud.com",
	"live.com",
	"mail.com",
	"me.com",
	"msn.com",
	"outlook.com",
	"pm.me",
	"proton.me",
	"protonmail.com",
	"yahoo.com",
	"ymail.com",
	"zoho.com",
]);

export const getEmailDomain = (value: string): string | null => {
	if (!value.includes("@")) {
		return null;
	}

	const [, domain] = value.trim().split(/@(.+)/);
	const normalizedDomain = domain?.trim().toLowerCase();

	if (!normalizedDomain) {
		return null;
	}

	return normalizedDomain;
};

export const isBlockedregisterEmailDomain = (value: string): boolean => {
	const domain = getEmailDomain(value);
	return domain ? BLOCKED_register_EMAIL_DOMAINS.has(domain) : false;
};

// (Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
export const isStrongPassword = (value: string): boolean => {
	const passwordRegex =
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
	return passwordRegex.test(value);
};

// (basic international format, e.g. +2348012345678)
export const isPhoneNumber = (value: string): boolean => {
	const phoneRegex = /^\+\d{10,15}$/;
	return phoneRegex.test(value);
};

export const isURL = (value: string): boolean => {
	try {
		// If no protocol, temporarily add one for validation
		const urlToTest = value.match(/^https?:\/\//i) ? value : `https://${value}`;
		new URL(urlToTest);
		return true;
	} catch {
		return false;
	}
};

export const isInRange = (value: number, min: number, max: number): boolean =>
	value >= min && value <= max;

export const isEqual = <T>(a: T, b: T): boolean => a === b;

// (3–20 chars, letters, numbers, underscores allowed)
export const isUsername = (value: string): boolean =>
	/^[a-zA-Z0-9_]{3,20}$/.test(value);

// ✅ Checks if a string is a valid ISO date (YYYY-MM-DD)
export const isISODate = (value: string): boolean => {
	const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (!isoDateRegex.test(value)) return false;
	const date = new Date(value);
	return date instanceof Date && !Number.isNaN(date.getTime());
};

// ✅ Checks if a credit card number passes Luhn algorithm
export const isCreditCard = (value: string): boolean => {
	const digits = value.replace(/\D/g, "");
	let sum = 0;
	let double = false;

	for (let i = digits.length - 1; i >= 0; i--) {
		let digit = parseInt(digits[i], 10);
		if (double) {
			digit *= 2;
			if (digit > 9) digit -= 9;
		}
		sum += digit;
		double = !double;
	}

	return sum % 10 === 0;
};

export const isPlainObject = (value: unknown): boolean => {
	return (
		value !== null && typeof value === "object" && value.constructor === Object
	);
};

export const isString = (value: unknown): boolean => {
	return typeof value === "string" || value instanceof String;
};
