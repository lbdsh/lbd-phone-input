export interface CountryDefinition {
  iso2: string;
  name: string;
  dialCode: string;
  mask?: string;
  example?: string;
}

export interface Country extends CountryDefinition {
  flag: string;
  priority: number;
}

export type FlagDisplayMode = "emoji" | "sprite" | "none";

export type PhoneInputTheme = "light" | "dark" | "auto";

export interface PhoneInputInitialValue {
  dialCode?: string;
  nationalNumber?: string;
  combined?: string;
}

export interface SubmissionBindings {
  dialCode?: string | HTMLInputElement;
  nationalNumber?: string | HTMLInputElement;
  combined?: string | HTMLInputElement;
}

export interface PhoneInputOptions {
  countries?: Array<CountryDefinition | Country>;
  preferredCountries?: string[];
  defaultCountry?: string;
  autoFormat?: boolean;
  nationalMode?: boolean;
  smartPlaceholder?: boolean;
  searchPlaceholder?: string;
  dropdownPlaceholder?: string;
  ariaLabelSelector?: string;
  disableDialCodeInsertion?: boolean;
  preventInvalidDialCode?: boolean;
  value?: PhoneInputInitialValue;
  bindings?: SubmissionBindings;
  onChange?: (state: PhoneInputState) => void;
  flagDisplay?: FlagDisplayMode;
  flagSpriteUrl?: string;
  flagSpriteRetinaUrl?: string;
  theme?: PhoneInputTheme;
  closeDropdownOnSelection?: boolean;
  language?: string;
  translations?: Partial<Record<string, string>>;
}

export interface PhoneInputState {
  country: Country;
  formattedValue: string;
  rawValue: string;
  nationalNumber: string;
  dialCode: string;
  e164: string;
  isValid: boolean;
  theme: "light" | "dark";
}

export interface PhonePayload {
  dialCode: string;
  nationalNumber: string;
  formattedValue: string;
  e164: string;
}

export interface PhoneInputTranslations {
  searchPlaceholder: string;
  dropdownPlaceholder: string;
  ariaLabelSelector: string;
  noResults: string;
}

export interface PhoneInputController {
  getCountry(): Country;
  getState(): PhoneInputState;
  getPayload(mode?: "combined" | "split" | "both"): string | PhonePayload | PhonePayload & { combined: string };
  getDialCode(): string;
  getNationalNumber(): string;
  setCountry(iso2: string): void;
  setValue(value: PhoneInputInitialValue): void;
  setTheme(theme: PhoneInputTheme): void;
  format(value: string): string;
  destroy(): void;
}

export type GeolocationCountryDetector = () => Promise<string | null | undefined>;

export interface SplitPhoneInputTargets {
  dialCode: string | HTMLInputElement;
  nationalNumber: string | HTMLInputElement;
  combined?: string | HTMLInputElement;
}
