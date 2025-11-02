import { Country, CountryDefinition } from "./types";

export const DIGIT_REGEX = /\d/g;

export const sanitizeValue = (value: string): string =>
  value.replace(/[^\d+]/g, "");

export const extractDigits = (value: string): string =>
  (value.match(DIGIT_REGEX) ?? []).join("");

export const formatWithMask = (mask: string | undefined, digits: string): string => {
  if (!mask) {
    return digits;
  }

  if (!digits.length) {
    return "";
  }

  let digitIndex = 0;
  const chars: string[] = [];

  for (const token of mask) {
    if (token === "#") {
      if (digitIndex < digits.length) {
        chars.push(digits[digitIndex]);
        digitIndex += 1;
      } else {
        chars.push("_");
      }
    } else {
      chars.push(token);
    }
  }

  const formatted = chars.join("");
  const placeholderIndex = formatted.indexOf("_");

  return placeholderIndex >= 0 ? formatted.slice(0, placeholderIndex) : formatted;
};

export const ensureLeadingPlus = (value: string): string => {
  if (!value) {
    return "";
  }

  return value.startsWith("+") ? value : `+${value}`;
};

export const normalizeDialCode = (value: string | undefined): string => {
  if (!value) {
    return "";
  }
  const digits = extractDigits(value);
  return digits ? `+${digits}` : "";
};

export const flagSort = (
  preferred: string[] | undefined,
  countries: Country[]
): Country[] => {
  if (!preferred || preferred.length === 0) {
    return [...countries];
  }

  const preferredSet = new Set(preferred.map((iso) => iso.toLowerCase()));

  const preferredCountries = preferred
    .map((iso) =>
      countries.find((country) => country.iso2.toLowerCase() === iso.toLowerCase())
    )
    .filter((country): country is Country => Boolean(country));
  const remainingCountries = countries.filter(
    (country) => !preferredSet.has(country.iso2.toLowerCase())
  );

  return [...preferredCountries, ...remainingCountries];
};

export const resolveCountry = (
  iso2: string | undefined,
  countries: Country[],
  fallback: Country
): Country => {
  if (!iso2) {
    return fallback;
  }

  const found = countries.find(
    (country) => country.iso2.toLowerCase() === iso2.toLowerCase()
  );

  return found ?? fallback;
};

export const mapCountriesWithFlags = (definitions: CountryDefinition[]): Country[] => {
  return definitions.map((definition, index) => ({
    ...definition,
    flag: isoToFlag(definition.iso2),
    priority: index
  }));
};

const isoToFlag = (iso: string): string => {
  return iso
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join("");
};

export const guessCountryFromInput = (
  value: string,
  countries: Country[],
  fallback: Country
): Country => {
  const sanitized = sanitizeValue(value);

  if (!sanitized.startsWith("+")) {
    return fallback;
  }

  // Check progressively longer dial codes.
  for (let length = 1; length <= 4; length += 1) {
    const prefix = sanitized.slice(0, length + 1); // include '+'
    const match = countries.find((country) => country.dialCode === prefix);
    if (match) {
      return match;
    }
  }

  return fallback;
};

export const buildSearchIndex = (countries: Country[]): CountrySearchIndex =>
  countries.map((country) => ({
    country,
    haystack: [
      country.name.toLowerCase(),
      country.iso2.toLowerCase(),
      country.dialCode.replace("+", ""),
      country.dialCode
    ].join(" ")
  }));

type CountrySearchIndex = Array<{
  country: Country;
  haystack: string;
}>;

export const filterCountries = (
  query: string,
  index: CountrySearchIndex
): Country[] => {
  const sanitized = query.trim().toLowerCase();
  if (!sanitized) {
    return index.map((entry) => entry.country);
  }

  return index
    .filter((entry) => entry.haystack.includes(sanitized))
    .map((entry) => entry.country);
};

export const findCountryByDialCode = (
  dialCode: string | undefined,
  countries: Country[],
  fallback: Country
): Country => {
  const normalized = normalizeDialCode(dialCode);
  if (!normalized) {
    return fallback;
  }

  const match = countries.find(
    (country) => normalizeDialCode(country.dialCode) === normalized
  );

  return match ?? fallback;
};

export const splitNumber = (
  value: string,
  country: Country
): { dialCode: string; nationalNumber: string } => {
  const digits = extractDigits(value);
  const dialDigits = extractDigits(country.dialCode);
  if (!digits.startsWith(dialDigits)) {
    return { dialCode: country.dialCode, nationalNumber: digits };
  }
  return {
    dialCode: country.dialCode,
    nationalNumber: digits.slice(dialDigits.length)
  };
};

export const toE164 = (dialCode: string, nationalNumber: string): string => {
  const dialDigits = extractDigits(ensureLeadingPlus(dialCode));
  const numberDigits = extractDigits(nationalNumber);
  const combined = dialDigits + numberDigits;
  return combined ? `+${combined}` : "";
};
