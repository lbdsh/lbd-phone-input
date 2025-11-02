import { DEFAULT_COUNTRIES } from "./countries";
import {
  Country,
  CountryDefinition,
  FlagDisplayMode,
  PhoneInputController,
  PhoneInputInitialValue,
  PhoneInputTheme,
  PhoneInputOptions,
  PhoneInputState,
  SubmissionBindings,
  PhonePayload
} from "./types";
import {
  buildSearchIndex,
  extractDigits,
  filterCountries,
  findCountryByDialCode,
  flagSort,
  formatPhoneNumber,
  guessCountryFromInput,
  normalizeDialCode,
  resolveCountry,
  sanitizeValue,
  splitNumber,
  toE164
} from "./utils";

const COMPONENT_CLASS = "lbd-phone-input";
const DROPDOWN_VISIBLE_CLASS = `${COMPONENT_CLASS}__dropdown--visible`;
const OPTION_ACTIVE_CLASS = `${COMPONENT_CLASS}__option--active`;

const DEFAULT_OPTIONS: {
  countries: Country[];
  preferredCountries: string[];
  defaultCountry: string;
  autoFormat: boolean;
  nationalMode: boolean;
  smartPlaceholder: boolean;
  searchPlaceholder: string;
  dropdownPlaceholder: string;
  ariaLabelSelector: string;
  disableDialCodeInsertion: boolean;
  preventInvalidDialCode: boolean;
  flagDisplay: FlagDisplayMode;
  flagSpriteUrl: string;
  flagSpriteRetinaUrl: string;
  theme: PhoneInputTheme;
} = {
  countries: DEFAULT_COUNTRIES,
  preferredCountries: ["it", "us", "gb", "fr", "de"],
  defaultCountry: "it",
  autoFormat: true,
  nationalMode: false,
  smartPlaceholder: true,
  searchPlaceholder: "Search country or code",
  dropdownPlaceholder: "Select a country",
  ariaLabelSelector: "Select country dial code",
  disableDialCodeInsertion: false,
  preventInvalidDialCode: true,
  flagDisplay: "emoji",
  flagSpriteUrl: "",
  flagSpriteRetinaUrl: "",
  theme: "auto"
};

type ResolvedOptions = PhoneInputOptions & typeof DEFAULT_OPTIONS;

const isoToFlag = (iso: string): string =>
  iso
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");

const normalizeCountries = (source: Array<Country | CountryDefinition>): Country[] =>
  source.map((entry, index) => {
    if ("flag" in entry) {
      return { ...entry, priority: "priority" in entry ? entry.priority ?? index : index };
    }
    return {
      ...entry,
      flag: isoToFlag(entry.iso2),
      priority: index
    };
  });

type BindingElements = {
  dialCode?: HTMLInputElement;
  nationalNumber?: HTMLInputElement;
  combined?: HTMLInputElement;
};

const resolveInputElement = (target: HTMLInputElement | string): HTMLInputElement => {
  if (target instanceof HTMLInputElement) {
    return target;
  }

  const element = typeof target === "string" ? document.querySelector(target) : null;
  if (!element) {
    throw new Error(`PhoneInput: unable to resolve element "${target}".`);
  }

  if (!(element instanceof HTMLInputElement)) {
    throw new Error("PhoneInput: target must be an input element.");
  }

  return element;
};

const resolveOptionalInput = (
  target: string | HTMLInputElement | undefined,
  role: keyof BindingElements
): HTMLInputElement | undefined => {
  if (!target) {
    return undefined;
  }

  if (target instanceof HTMLInputElement) {
    return target;
  }

  const element = document.querySelector(target);
  if (!element) {
    throw new Error(`PhoneInput: unable to resolve ${role} binding "${target}".`);
  }

  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`PhoneInput: binding for ${role} must be an input element.`);
  }

  return element;
};

const createFlagElement = (
  country: Country,
  mode: FlagDisplayMode,
  context: "selector" | "option"
): HTMLElement | null => {
  if (mode === "none") {
    return null;
  }

  const span = document.createElement("span");
  const baseClass =
    context === "selector"
      ? `${COMPONENT_CLASS}__selector-flag`
      : `${COMPONENT_CLASS}__flag`;

  span.className = baseClass;
  span.setAttribute("aria-hidden", "true");

  if (mode === "emoji") {
    span.classList.add(`${COMPONENT_CLASS}__flag--emoji`);
    span.textContent = country.flag;
  } else if (mode === "sprite") {
    span.classList.add(
      `${COMPONENT_CLASS}__flag--sprite`,
      "lbd-flag",
      `lbd-flag--${country.iso2.toLowerCase()}`
    );
  }

  return span;
};

const createOptionElement = (
  country: Country,
  isActive: boolean,
  flagDisplay: FlagDisplayMode
): HTMLLIElement => {
  const item = document.createElement("li");
  item.className = `${COMPONENT_CLASS}__option`;
  if (isActive) {
    item.classList.add(OPTION_ACTIVE_CLASS);
  }
  item.setAttribute("role", "option");
  item.dataset.iso2 = country.iso2;

  const flag = createFlagElement(country, flagDisplay, "option");
  if (flag) {
    item.append(flag);
  }

  const label = document.createElement("span");
  label.className = `${COMPONENT_CLASS}__label`;

  const countryName = document.createElement("span");
  countryName.className = `${COMPONENT_CLASS}__country-name`;
  countryName.textContent = country.name;

  const dialCode = document.createElement("span");
  dialCode.className = `${COMPONENT_CLASS}__dial-code`;
  dialCode.textContent = country.dialCode;

  label.append(countryName, dialCode);
  item.append(label);

  return item;
};

const createPlaceholderOption = (label: string): HTMLLIElement => {
  const item = document.createElement("li");
  item.className = `${COMPONENT_CLASS}__placeholder`;
  item.textContent = label;
  item.setAttribute("aria-hidden", "true");
  return item;
};

class VanillaPhoneInput implements PhoneInputController {
  private input: HTMLInputElement;
  private wrapper: HTMLDivElement;
  private selectorButton: HTMLButtonElement;
  private dropdown: HTMLDivElement;
  private searchInput: HTMLInputElement;
  private optionList: HTMLUListElement;
  private options: ResolvedOptions;
  private countries: Country[];
  private searchIndex: ReturnType<typeof buildSearchIndex>;
  private selectedCountry!: Country;
  private flagDisplay: FlagDisplayMode;
  private themeMode: PhoneInputTheme;
  private currentTheme: "light" | "dark" = "light";
  private themeQuery?: MediaQueryList;
  private themeQueryListener?: (event: MediaQueryListEvent) => void;
  private isReady = false;
  private bindings: BindingElements = {};
  private unsubs: Array<() => void> = [];
  private lastCommittedValue = "";

  constructor(target: HTMLInputElement | string, options?: PhoneInputOptions) {
    if (typeof window === "undefined") {
      throw new Error("PhoneInput: window is not available. This component must run in the browser.");
    }

    this.input = resolveInputElement(target);
    const countriesSource = options?.countries ?? DEFAULT_OPTIONS.countries;
    const normalizedCountries = normalizeCountries(countriesSource).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      countries: normalizedCountries
    };

    const allowedFlagModes: FlagDisplayMode[] = ["emoji", "sprite", "none"];
    const requestedFlagMode = (this.options.flagDisplay ?? "emoji") as FlagDisplayMode;
    this.flagDisplay = allowedFlagModes.includes(requestedFlagMode) ? requestedFlagMode : "emoji";
    this.options.flagDisplay = this.flagDisplay;

    this.themeMode = this.options.theme ?? "auto";
    this.options.theme = this.themeMode;

    this.bindings = this.resolveBindings(this.options.bindings);

    this.countries = flagSort(
      this.options.preferredCountries,
      this.options.countries
    );

    this.searchIndex = buildSearchIndex(this.countries);

    this.wrapper = document.createElement("div");
    this.wrapper.className = COMPONENT_CLASS;
    if (this.flagDisplay === "sprite") {
      this.wrapper.classList.add(`${COMPONENT_CLASS}--sprite`);
    }
    if (this.flagDisplay === "none") {
      this.wrapper.classList.add(`${COMPONENT_CLASS}--no-flag`);
    }

    if (this.flagDisplay === "sprite") {
      if (this.options.flagSpriteUrl && this.options.flagSpriteUrl.trim().length > 0) {
        this.wrapper.style.setProperty("--lbd-flag-sprite-url", `url("${this.options.flagSpriteUrl}")`);
      }
      if (this.options.flagSpriteRetinaUrl && this.options.flagSpriteRetinaUrl.trim().length > 0) {
        this.wrapper.style.setProperty("--lbd-flag-sprite-2x-url", `url("${this.options.flagSpriteRetinaUrl}")`);
      }
    }

    if (this.themeMode === "auto") {
      this.setupAutoTheme();
    } else {
      this.applyTheme(this.themeMode);
    }

    this.selectorButton = document.createElement("button");
    this.selectorButton.type = "button";
    this.selectorButton.className = `${COMPONENT_CLASS}__selector`;
    this.selectorButton.setAttribute("aria-haspopup", "listbox");
    this.selectorButton.setAttribute("aria-expanded", "false");
    this.selectorButton.setAttribute("aria-label", this.options.ariaLabelSelector);

    this.dropdown = document.createElement("div");
    this.dropdown.className = `${COMPONENT_CLASS}__dropdown`;
    this.dropdown.setAttribute("role", "dialog");
    this.dropdown.setAttribute("aria-hidden", "true");

    this.searchInput = document.createElement("input");
    this.searchInput.type = "search";
    this.searchInput.className = `${COMPONENT_CLASS}__search`;
    this.searchInput.placeholder = this.options.searchPlaceholder;

    this.optionList = document.createElement("ul");
    this.optionList.className = `${COMPONENT_CLASS}__options`;
    this.optionList.setAttribute("role", "listbox");
    this.optionList.tabIndex = -1;

    this.dropdown.append(this.searchInput, this.optionList);

    this.buildStructure();

    const incomingValue = this.collectIncomingValue();
    const initialCountry = this.resolveInitialCountry(incomingValue);
    this.applyInitialValue(initialCountry, incomingValue);
    this.setCountry(initialCountry.iso2);

    this.bindEvents();
    this.isReady = true;
  }

  private resolveBindings(bindings?: SubmissionBindings): BindingElements {
    if (!bindings) {
      return {};
    }

    return {
      dialCode: resolveOptionalInput(bindings.dialCode, "dialCode"),
      nationalNumber: resolveOptionalInput(bindings.nationalNumber, "nationalNumber"),
      combined: resolveOptionalInput(bindings.combined, "combined")
    };
  }

  private collectIncomingValue(): PhoneInputInitialValue {
    const optionValue = this.options.value ?? {};
    const dialCode =
      optionValue.dialCode ??
      this.bindings.dialCode?.value ??
      undefined;
    const nationalNumber =
      optionValue.nationalNumber ??
      this.bindings.nationalNumber?.value ??
      undefined;
    const combinedCandidate =
      optionValue.combined ??
      this.bindings.combined?.value ??
      (this.input.value ? this.input.value : undefined);

    return {
      dialCode,
      nationalNumber,
      combined: combinedCandidate
    };
  }

  private applyTheme(theme: "light" | "dark"): void {
    this.wrapper.classList.remove(`${COMPONENT_CLASS}--light`, `${COMPONENT_CLASS}--dark`);
    this.wrapper.classList.add(`${COMPONENT_CLASS}--${theme}`);
    this.wrapper.dataset.theme = theme;
    this.currentTheme = theme;
  }

  private setupAutoTheme(): void {
    if (typeof window === "undefined") {
      this.applyTheme("light");
      return;
    }

    this.teardownAutoTheme();
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    this.themeQuery = query;
    const listener = (event: MediaQueryListEvent) => {
      this.applyTheme(event.matches ? "dark" : "light");
      if (this.isReady) {
        this.emitChange();
      }
    };
    this.themeQueryListener = listener;
    query.addEventListener("change", listener);
    this.applyTheme(query.matches ? "dark" : "light");
  }

  private teardownAutoTheme(): void {
    if (this.themeQuery && this.themeQueryListener) {
      this.themeQuery.removeEventListener("change", this.themeQueryListener);
    }
    this.themeQuery = undefined;
    this.themeQueryListener = undefined;
  }

  private applyInitialValue(country: Country, value: PhoneInputInitialValue): void {
    const normalizedDial = normalizeDialCode(value.dialCode) || country.dialCode;
    let nationalNumber = value.nationalNumber ?? "";

    if (!nationalNumber && value.combined) {
      nationalNumber = splitNumber(value.combined, country).nationalNumber;
    }

    if (this.options.nationalMode) {
      this.input.value = nationalNumber;
    } else {
      const combined =
        value.combined ||
        (nationalNumber
          ? toE164(normalizedDial, nationalNumber)
          : normalizedDial);
      this.input.value = combined;
    }
  }

  public getCountry(): Country {
    return this.selectedCountry;
  }

  public getDialCode(): string {
    return this.selectedCountry.dialCode;
  }

  public getNationalNumber(): string {
    const state = this.getState();
    return state.nationalNumber;
  }

  public getPayload(
    mode: "combined" | "split" | "both" = "combined"
  ): string | PhonePayload | (PhonePayload & { combined: string }) {
    const state = this.getState();
    const payload = {
      dialCode: state.dialCode,
      nationalNumber: state.nationalNumber,
      formattedValue: state.formattedValue,
      e164: state.e164
    };

    switch (mode) {
      case "split":
        return payload;
      case "both":
        return { ...payload, combined: state.e164 || state.formattedValue };
      case "combined":
      default:
        return state.e164 || state.formattedValue;
    }
  }

  public setValue(value: PhoneInputInitialValue): void {
    const targetCountry = this.resolveCountryFromValue(
      value,
      this.selectedCountry ?? this.countries[0]
    );
    this.options.value = { ...value };
    this.applyInitialValue(targetCountry, value);
    this.setCountry(targetCountry.iso2);
  }

  public setTheme(theme: PhoneInputTheme): void {
    const previousTheme = this.currentTheme;
    this.options.theme = theme;
    this.themeMode = theme;
    if (theme === "auto") {
      this.setupAutoTheme();
    } else {
      this.teardownAutoTheme();
      this.applyTheme(theme);
    }

    if (this.isReady && previousTheme !== this.currentTheme) {
      this.emitChange();
    }
  }

  public setCountry(iso2: string): void {
    const nextCountry = resolveCountry(
      iso2,
      this.countries,
      this.countries[0]
    );

    if (this.selectedCountry && nextCountry.iso2 === this.selectedCountry.iso2) {
      return;
    }

    this.selectedCountry = nextCountry;
    this.updateSelectorButton();
    this.highlightActiveOption();
    this.applyPlaceholder();
    this.commitFormattedValue();
  }

  public getState(): PhoneInputState {
    const rawValue = this.input.value;
    const formattedValue = formatPhoneNumber(rawValue, this.selectedCountry, {
      autoFormat: this.options.autoFormat,
      nationalMode: this.options.nationalMode,
      disableDialCodeInsertion: this.options.disableDialCodeInsertion
    });
    const split = splitNumber(formattedValue, this.selectedCountry);
    let nationalNumber = split.nationalNumber;

    if (this.options.nationalMode) {
      nationalNumber = extractDigits(rawValue);
    }

    const dialCode = this.selectedCountry.dialCode;
    const e164 = toE164(dialCode, nationalNumber);

    return {
      country: this.selectedCountry,
      formattedValue,
      rawValue,
      nationalNumber,
      dialCode,
      e164,
      isValid: this.isValid(nationalNumber),
      theme: this.currentTheme
    };
  }

  public format(value: string): string {
    return formatPhoneNumber(value, this.selectedCountry, {
      autoFormat: this.options.autoFormat,
      nationalMode: this.options.nationalMode,
      disableDialCodeInsertion: this.options.disableDialCodeInsertion
    });
  }

  public destroy(): void {
    this.teardownAutoTheme();
    this.unsubs.forEach((unsubscribe) => unsubscribe());
    this.unsubs = [];
    this.dropdown.remove();
    this.selectorButton.remove();
    this.wrapper.replaceWith(this.input);
    this.input.classList.remove(`${COMPONENT_CLASS}__input`);
  }

  private buildStructure(): void {
    const parent = this.input.parentElement;
    if (!parent) {
      throw new Error("PhoneInput: input element must have a parent node.");
    }

    parent.insertBefore(this.wrapper, this.input);
    this.wrapper.append(this.selectorButton);
    this.wrapper.append(this.input);
    this.wrapper.append(this.dropdown);
    this.input.classList.add(`${COMPONENT_CLASS}__input`);
    this.renderOptions(this.countries);
  }

  private bindEvents(): void {
    const handleDocumentClick = (event: Event) => {
      if (
        !this.wrapper.contains(event.target as Node) &&
        this.dropdown.classList.contains(DROPDOWN_VISIBLE_CLASS)
      ) {
        this.closeDropdown();
      }
    };

    const handleButtonClick = () => {
      if (this.dropdown.classList.contains(DROPDOWN_VISIBLE_CLASS)) {
        this.closeDropdown();
      } else {
        this.openDropdown("search");
      }
    };

    const handleButtonKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter") {
        event.preventDefault();
        this.openDropdown("list");
      }
    };

    const handleSearchInput = () => {
      const query = this.searchInput.value;
      const filtered = filterCountries(query, this.searchIndex);
      this.renderOptions(filtered);
      this.focusFirstOption();
    };

    const handleOptionClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const option = target.closest(`.${COMPONENT_CLASS}__option`) as HTMLElement | null;
      if (!option) {
        return;
      }
      const iso2 = option.dataset.iso2;
      if (iso2) {
        this.setCountry(iso2);
        this.closeDropdown();
        this.input.focus();
      }
    };

    const handleOptionKeyDown = (event: KeyboardEvent) => {
      const options = Array.from(
        this.optionList.querySelectorAll(`.${COMPONENT_CLASS}__option`)
      );
      if (!options.length) {
        return;
      }

      const getActiveIndex = () =>
        options.findIndex((option) => option.classList.contains(OPTION_ACTIVE_CLASS));

      if (getActiveIndex() === -1) {
        options[0]?.classList.add(OPTION_ACTIVE_CLASS);
      }

      const moveFocus = (delta: number) => {
        const currentIndex = getActiveIndex();
        const baseIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex = (baseIndex + delta + options.length) % options.length;
        const nextOption = options[nextIndex];
        options.forEach((opt) => opt.classList.remove(OPTION_ACTIVE_CLASS));
        nextOption.classList.add(OPTION_ACTIVE_CLASS);
        nextOption.scrollIntoView({ block: "nearest" });
      };

      const commitSelection = () => {
        const activeIndex = getActiveIndex();
        if (activeIndex < 0) {
          return;
        }
        const current = options[activeIndex] as HTMLLIElement;
        const iso = current.dataset.iso2;
        if (iso) {
          this.setCountry(iso);
          this.closeDropdown();
          this.input.focus();
        }
      };

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          moveFocus(1);
          break;
        case "ArrowUp":
          event.preventDefault();
          moveFocus(-1);
          break;
        case "Enter":
          event.preventDefault();
          commitSelection();
          break;
        case "Escape":
          event.preventDefault();
          this.closeDropdown();
          this.selectorButton.focus();
          break;
        default:
          break;
      }
    };

    const handleInput = () => {
      this.normalizeValue();
      this.syncCountryFromValue();
      this.emitChange();
    };

    const handleBlur = () => {
      if (this.input.value === "") {
        return;
      }
      this.commitFormattedValue();
    };

    document.addEventListener("click", handleDocumentClick, true);
    this.selectorButton.addEventListener("click", handleButtonClick);
    this.selectorButton.addEventListener("keydown", handleButtonKeyDown);
    this.searchInput.addEventListener("input", handleSearchInput);
    this.optionList.addEventListener("click", handleOptionClick);
    this.optionList.addEventListener("keydown", handleOptionKeyDown);
    this.input.addEventListener("input", handleInput);
    this.input.addEventListener("blur", handleBlur);

    this.unsubs.push(() => document.removeEventListener("click", handleDocumentClick, true));
    this.unsubs.push(() => this.selectorButton.removeEventListener("click", handleButtonClick));
    this.unsubs.push(() => this.selectorButton.removeEventListener("keydown", handleButtonKeyDown));
    this.unsubs.push(() => this.searchInput.removeEventListener("input", handleSearchInput));
    this.unsubs.push(() => this.optionList.removeEventListener("click", handleOptionClick));
    this.unsubs.push(() => this.optionList.removeEventListener("keydown", handleOptionKeyDown));
    this.unsubs.push(() => this.input.removeEventListener("input", handleInput));
    this.unsubs.push(() => this.input.removeEventListener("blur", handleBlur));
  }

  private renderOptions(countries: Country[]): void {
    const currentIso = this.selectedCountry?.iso2;
    this.optionList.innerHTML = "";

    if (this.options.dropdownPlaceholder) {
      this.optionList.append(createPlaceholderOption(this.options.dropdownPlaceholder));
    }

    for (const country of countries) {
      const option = createOptionElement(country, country.iso2 === currentIso, this.flagDisplay);
      this.optionList.append(option);
    }
  }

  private focusFirstOption(): void {
    const active =
      this.optionList.querySelector(`.${OPTION_ACTIVE_CLASS}`) as HTMLElement | null;
    const fallback = this.optionList.querySelector(
      `.${COMPONENT_CLASS}__option`
    ) as HTMLElement | null;
    const target = active ?? fallback;
    if (target) {
      this.optionList
        .querySelectorAll(`.${OPTION_ACTIVE_CLASS}`)
        .forEach((option) => option.classList.remove(OPTION_ACTIVE_CLASS));
      target.classList.add(OPTION_ACTIVE_CLASS);
      this.optionList.focus();
      target.scrollIntoView({ block: "nearest" });
    }
  }

  private openDropdown(initialFocus: "search" | "list" = "search"): void {
    this.dropdown.classList.add(DROPDOWN_VISIBLE_CLASS);
    this.dropdown.setAttribute("aria-hidden", "false");
    this.selectorButton.setAttribute("aria-expanded", "true");
    this.searchInput.value = "";
    this.renderOptions(this.countries);
    if (initialFocus === "list") {
      requestAnimationFrame(() => this.focusFirstOption());
    } else {
      requestAnimationFrame(() => this.searchInput.focus());
    }
  }

  private closeDropdown(): void {
    this.dropdown.classList.remove(DROPDOWN_VISIBLE_CLASS);
    this.dropdown.setAttribute("aria-hidden", "true");
    this.selectorButton.setAttribute("aria-expanded", "false");
  }

  private resolveCountryFromValue(
    value: PhoneInputInitialValue,
    fallback: Country
  ): Country {
    if (value.dialCode) {
      return findCountryByDialCode(value.dialCode, this.countries, fallback);
    }
    if (value.combined) {
      return guessCountryFromInput(value.combined, this.countries, fallback);
    }
    return fallback;
  }

  private resolveInitialCountry(value: PhoneInputInitialValue): Country {
    const defaultCountry = resolveCountry(
      this.options.defaultCountry,
      this.countries,
      this.countries[0]
    );

    return this.resolveCountryFromValue(value, defaultCountry);
  }

  private updateSelectorButton(): void {
    this.selectorButton.innerHTML = "";

    const flag = createFlagElement(this.selectedCountry, this.flagDisplay, "selector");
    if (flag) {
      this.selectorButton.append(flag);
    }

    const dial = document.createElement("span");
    dial.className = `${COMPONENT_CLASS}__selector-dial`;
    dial.textContent = this.selectedCountry.dialCode;
    this.selectorButton.append(dial);

    this.selectorButton.title = `${this.selectedCountry.name} ${this.selectedCountry.dialCode}`;
  }

  private highlightActiveOption(): void {
    this.optionList
      .querySelectorAll(`.${COMPONENT_CLASS}__option`)
      .forEach((option) => option.classList.remove(OPTION_ACTIVE_CLASS));

    const active = this.optionList.querySelector(
      `.${COMPONENT_CLASS}__option[data-iso2="${this.selectedCountry.iso2}"]`
    );
    if (active) {
      active.classList.add(OPTION_ACTIVE_CLASS);
      active.scrollIntoView({ block: "nearest" });
    }
  }

  private applyPlaceholder(): void {
    if (!this.options.smartPlaceholder) {
      return;
    }
    const placeholder = this.selectedCountry.example ?? "";
    this.input.placeholder = placeholder;
  }

  private normalizeValue(): void {
    if (!this.options.preventInvalidDialCode || this.options.nationalMode) {
      return;
    }

    const sanitized = sanitizeValue(this.input.value);
    const dialCode = this.selectedCountry.dialCode;

    if (!sanitized.startsWith(dialCode)) {
      const dialDigits = extractDigits(dialCode);
      const digitsOnly = extractDigits(sanitized);
      const nationalDigits = digitsOnly.startsWith(dialDigits)
        ? digitsOnly.slice(dialDigits.length)
        : digitsOnly;
      const newValue = nationalDigits ? `${dialCode} ${nationalDigits}` : dialCode;
      this.input.value = newValue;
    }
  }

  private syncCountryFromValue(): void {
    const newCountry = guessCountryFromInput(
      this.input.value,
      this.countries,
      this.selectedCountry
    );

    if (newCountry.iso2 !== this.selectedCountry.iso2) {
      this.selectedCountry = newCountry;
      this.updateSelectorButton();
      this.applyPlaceholder();
      this.highlightActiveOption();
    }
  }

  private commitFormattedValue(): void {
    if (!this.options.autoFormat) {
      return;
    }

    const formatted = formatPhoneNumber(this.input.value, this.selectedCountry, {
      autoFormat: this.options.autoFormat,
      nationalMode: this.options.nationalMode,
      disableDialCodeInsertion: this.options.disableDialCodeInsertion
    });

    if (formatted === this.lastCommittedValue) {
      return;
    }

    this.lastCommittedValue = formatted;
    this.input.value = formatted;
    this.emitChange();
  }

  private emitChange(): void {
    const state = this.getState();
    this.syncBindings(state);
    if (typeof this.options.onChange === "function") {
      this.options.onChange(state);
    }
    const event = new CustomEvent<PhoneInputState>("phone-change", {
      detail: state,
      bubbles: true
    });
    this.input.dispatchEvent(event);
  }

  private syncBindings(state: PhoneInputState): void {
    if (this.bindings.dialCode) {
      this.bindings.dialCode.value = state.dialCode;
    }
    if (this.bindings.nationalNumber) {
      this.bindings.nationalNumber.value = state.nationalNumber;
    }
    if (this.bindings.combined) {
      this.bindings.combined.value = state.e164 || state.formattedValue;
    }
  }

  private isValid(nationalDigits: string): boolean {
    return nationalDigits.length >= 6;
  }
}

export const createPhoneInput = (
  target: HTMLInputElement | string,
  options?: PhoneInputOptions
): PhoneInputController => {
  return new VanillaPhoneInput(target, options);
};

export const createPhoneInputs = (
  selector: string,
  options?: PhoneInputOptions
): PhoneInputController[] => {
  return Array.from(document.querySelectorAll<HTMLInputElement>(selector)).map((input) =>
    createPhoneInput(input, options)
  );
};

export * from "./types";
export { DEFAULT_COUNTRIES } from "./countries";
