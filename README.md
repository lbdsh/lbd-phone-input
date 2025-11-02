# lbd-phone-input

<p align="center">
  <a href="https://www.transfeero.com" target="_blank" rel="noopener">
    <img src="https://transfeeropublic.s3.eu-west-1.amazonaws.com/logo_transfeero_final_white.png" alt="Transfeero" height="60" />
  </a>
</p>

> Ultra-flexible, framework-agnostic phone inputs with accessible country selectors, smart formatting, geo-aware defaults, translations, and backend-friendly payloads.

lbd-phone-input is maintained and proudly sponsored by [Transfeero](https://www.transfeero.com), the premium airport transfer platform.

---

## Table of contents

- [Overview](#overview)
- [Installation](#installation)
- [60-second quick start](#60-second-quick-start)
- [Why choose lbd-phone-input?](#why-choose-lbd-phone-input)
- [Feature tour](#feature-tour)
  - [Flag rendering](#flag-rendering)
  - [Adaptive themes](#adaptive-themes)
  - [Realistic placeholders & masking](#realistic-placeholders--masking)
  - [Language support](#language-support)
  - [Geo-aware defaults](#geo-aware-defaults)
  - [Split inputs](#split-inputs)
- [Usage patterns & recipes](#usage-patterns--recipes)
- [Configuration reference](#configuration-reference)
- [Events & payloads](#events--payloads)
- [Translations](#translations)
- [Styling & design tokens](#styling--design-tokens)
- [Framework integration](#framework-integration)
- [Accessibility & keyboard support](#accessibility--keyboard-support)
- [Release workflow](#release-workflow)
- [FAQ](#faq)
- [Sponsor & license](#sponsor--license)

---

## Overview

<p align="center">
  <img src="https://transfeeropublic.s3.eu-west-1.amazonaws.com/lbd.png" alt="lbd-phone-input dropdown example" width="720" />
</p>

lbd-phone-input ships as a zero-dependency TypeScript module. It embraces progressive enhancement: a single call transforms any `<input type="tel">` into a fully accessible phone widget.

---

## Installation

```bash
npm install lbd-phone-input
# or
yarn add lbd-phone-input
# or
pnpm add lbd-phone-input
```

Requires Node 18+ for local tooling and modern browsers (ES2020).

---

## 60-second quick start

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Phone form</title>
    <link rel="stylesheet" href="/node_modules/lbd-phone-input/dist/styles.css" />
  </head>
  <body>
    <label>
      Phone number
      <input id="phone" type="tel" autocomplete="tel" />
    </label>

    <input type="hidden" id="dial" name="dial_code" />
    <input type="hidden" id="national" name="national_number" />
    <input type="hidden" id="full" name="full_number" />

    <script type="module">
      import { createPhoneInput, detectBrowserCountry } from "lbd-phone-input";

      const controller = createPhoneInput("#phone", {
        preferredCountries: ["it", "gb", "us"],
        defaultCountry: "it",
        flagDisplay: "sprite",
        theme: "auto",
        nationalMode: true,
        bindings: {
          dialCode: "#dial",
          nationalNumber: "#national",
          combined: "#full"
        }
      });

      detectBrowserCountry().then((iso2) => iso2 && controller.setCountry(iso2));

      document.querySelector("#phone").addEventListener("phone-change", ({ detail }) => {
        console.log("Current state", detail);
      });
    </script>
  </body>
</html>
```

---

## Why choose lbd-phone-input?

- **Modern UX:** Emoji or sprite flags, smart masking, and polished dark/light themes out-of-the-box.
- **Accessible by design:** ARIA labels, keyboard navigation, and screen-reader hints are all baked in.
- **Global ready:** Realistic placeholders plus translations for the ten most-spoken languages.
- **Geo-smart:** Automatically selects the user’s country using browser language hints.
- **Backend friendly:** Exposes dial code, national number, formatted value, and E.164 string simultaneously.
- **Framework agnostic:** Vanilla TypeScript API works with React, Vue, Svelte, Angular, Bootstrap, Tailwind, or plain HTML.
- **Split-input helper:** Easily separate dial-code and phone fields without losing validation logic.

---

## Feature tour

### Flag rendering

Choose between emoji flags, a retina PNG sprite, or hide flags completely.

```ts
createPhoneInput("#emoji", { flagDisplay: "emoji" });
createPhoneInput("#sprite", { flagDisplay: "sprite" });
createPhoneInput("#minimal", { flagDisplay: "none" });
```

Pass custom sprite URLs through `flagSpriteUrl` and `flagSpriteRetinaUrl` when bundling assets locally.

### Adaptive themes

- `theme: "auto"` picks up the user’s system preference (light/dark).
- `setTheme("light" | "dark" | "auto")` switches themes at runtime.
- CSS variables (`--lbd-bg`, `--lbd-input-bg`, `--lbd-text-color`, etc.) make it trivial to match any design system.

### Realistic placeholders & masking

Every country ships with a plausible example (`347 12 12 456` for Italy). Placeholders automatically update when the selection changes, and the input is masked in national mode.

### Language support

Built-in translations for English, Italian, Spanish, French, German, Portuguese, Russian, Chinese (Simplified), Japanese, and Arabic. Override or extend strings with `translations`.

### Geo-aware defaults

Call `detectBrowserCountry()` to pre-select the correct dial code based on browser settings. No external service required.

### Split inputs

Use `createSplitPhoneInput` to keep dial code and national number in two separate fields while sharing formatting, validation, and events.

```ts
createSplitPhoneInput({
  dialCode: "#billing-dial",
  nationalNumber: "#billing-phone",
  combined: "#billing-phone-e164"
}, {
  preferredCountries: ["us", "ca"],
  flagDisplay: "sprite"
});
```

---

## Usage patterns & recipes

### Plain HTML

```html
<input id="support-phone" type="tel" class="form-control" />
<script type="module">
  import { createPhoneInput } from "lbd-phone-input";

  createPhoneInput("#support-phone", {
    theme: "dark",
    preferredCountries: ["us", "ca", "mx"],
    autoFormat: true
  });
</script>
```

### Auto-detect & national mode

```ts
const controller = createPhoneInput("#shipping-phone", {
  nationalMode: true,
  smartPlaceholder: true
});

detectBrowserCountry().then((iso2) => iso2 && controller.setCountry(iso2));
```

### Split inputs with validation

```ts
const split = createSplitPhoneInput({
  dialCode: "#checkout-dial",
  nationalNumber: "#checkout-phone",
  combined: "#checkout-e164"
}, {
  nationalMode: true,
  closeDropdownOnSelection: false
});

document.querySelector("#checkout-phone").addEventListener("phone-change", ({ detail }) => {
  document.querySelector("#error").hidden = detail.isValid;
});
```

### Bulk initialization

```ts
import { createPhoneInputs } from "lbd-phone-input";

createPhoneInputs('input[data-phone="true"]', {
  flagDisplay: "none",
  autoFormat: false,
  preferredCountries: ["de", "fr", "it"]
});
```

### Inline formatting helper

```ts
const { format } = createPhoneInput("#callback-phone");
console.log(format("02079460958")); // "+44 20 7946 0958"
```

---

## Configuration reference

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `countries` | `Array<CountryDefinition \| Country>` | built-in dataset | Supply custom data; flags generated automatically when omitted. |
| `preferredCountries` | `string[]` | `["it","us","gb","fr","de"]` | ISO alpha-2 codes pinned to the top of the list. |
| `defaultCountry` | `string` | `"it"` | Initial ISO selection. |
| `autoFormat` | `boolean` | `true` | Apply national masks while typing. |
| `nationalMode` | `boolean` | `false` | Keep value in national format instead of international E.164. |
| `smartPlaceholder` | `boolean` | `true` | Realistic example for the current country. |
| `searchPlaceholder` | `string` | language dependent | Overrides the translated search placeholder. |
| `dropdownPlaceholder` | `string` | language dependent | Text shown above the country list. |
| `ariaLabelSelector` | `string` | language dependent | Accessible label for the flag button. |
| `language` | `string` | auto (from `navigator.language`) | Force a specific translation locale. |
| `translations` | `Partial<PhoneInputTranslations>` | `{}` | Override individual strings. |
| `flagDisplay` | `"emoji" \| "sprite" \| "none"` | `"emoji"` | Flag display mode. |
| `flagSpriteUrl` | `string` | built-in | Provide your own sprite. |
| `flagSpriteRetinaUrl` | `string` | built-in | High-DPI sprite. |
| `theme` | `"auto" \| "light" \| "dark"` | `"auto"` | Theme mode. |
| `closeDropdownOnSelection` | `boolean` | `true` | Keep dropdown open if `false`. |
| `bindings` | `SubmissionBindings` | `undefined` | Sync values into external inputs. |
| `value` | `PhoneInputInitialValue` | `undefined` | Prefill dial code / national / combined value. |
| `onChange` | `(state) => void` | `undefined` | Subscribe to changes. |

---

## Events & payloads

Each change emits `phone-change` from the original `<input>`.

```ts
input.addEventListener("phone-change", ({ detail }) => {
  console.log(detail);
});
```

Sample payload:

```json
{
  "dialCode": "+39",
  "nationalNumber": "3471212456",
  "formattedValue": "+39 347 12 12 456",
  "e164": "+393471212456",
  "country": { "iso2": "it", "name": "Italy", "...": "..." },
  "isValid": true,
  "theme": "dark"
}
```

---

## Translations

Supported languages: **English, Italian, Spanish, French, German, Portuguese, Russian, Chinese (zh), Japanese (ja), Arabic (ar).**

```ts
createPhoneInput("#support-it", { language: "it" });

createPhoneInput("#custom", {
  translations: {
    searchPlaceholder: "Buscar teléfono",
    dropdownPlaceholder: "Selecciona un destino",
    ariaLabelSelector: "Selecciona el prefijo"
  }
});
```

Need another locale? Provide overrides for all the fields in `PhoneInputTranslations`.

---

## Styling & design tokens

| Variable | Purpose |
| --- | --- |
| `--lbd-bg` | Widget background color |
| `--lbd-text-color` | Primary text color |
| `--lbd-muted-color` | Secondary text |
| `--lbd-border-color` | Input border |
| `--lbd-border-radius` | Rounded corners |
| `--lbd-focus-ring` | Focus outline shadow |
| `--lbd-input-bg` | Visible input background |
| `--lbd-input-placeholder` | Placeholder color |
| `--lbd-search-bg` / `--lbd-search-border` | Dropdown search field styling |
| `--lbd-option-hover` | Option hover color |
| `--lbd-flag-sprite-url` / `--lbd-flag-sprite-2x-url` | Sprite references |

```css
.lbd-phone-input {
  --lbd-border-radius: 16px;
  --lbd-border-color: rgba(15, 23, 42, 0.12);
  --lbd-bg: #f8fafc;
  --lbd-text-color: #0f172a;
}
```

Combine them with Tailwind or Bootstrap utility classes to match existing form themes.

---

## Framework integration

### React

```tsx
import { useEffect, useRef } from "react";
import { createPhoneInput, detectBrowserCountry, PhoneInputController } from "lbd-phone-input";
import "lbd-phone-input/dist/styles.css";

export function PhoneField() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const controller: PhoneInputController = createPhoneInput(ref.current, { theme: "auto" });
    detectBrowserCountry().then((iso2) => iso2 && controller.setCountry(iso2));
    return () => controller.destroy();
  }, []);

  return <input ref={ref} type="tel" className="form-control" />;
}
```

### Vue 3 (Composition API)

```ts
import { onMounted, onBeforeUnmount, ref } from "vue";
import { createPhoneInput, type PhoneInputController } from "lbd-phone-input";
import "lbd-phone-input/dist/styles.css";

export default {
  setup() {
    const el = ref<HTMLInputElement | null>(null);
    let controller: PhoneInputController | null = null;

    onMounted(() => {
      if (el.value) {
        controller = createPhoneInput(el.value, { theme: "dark" });
      }
    });

    onBeforeUnmount(() => controller?.destroy());

    return { el };
  }
};
```

### With Tailwind/Bootstrap

```html
<div class="form-floating">
  <input id="bootstrap-phone" type="tel" class="form-control" />
  <label for="bootstrap-phone">Emergency contact</label>
</div>

<script type="module">
  import { createPhoneInput } from "lbd-phone-input";
  createPhoneInput("#bootstrap-phone", { theme: "light", flagDisplay: "sprite" });
</script>
```

---

## Accessibility & keyboard support

- `Tab` focuses the dial selector, `Enter` opens the list.
- Arrow keys navigate countries; `Enter` selects; `Esc` closes the dropdown.
- Screen readers announce the currently selected country and dial code.
- The dropdown search field supports typing without losing focus.

---

## Release workflow

This repository includes a GitHub Actions workflow (`.github/workflows/release.yml`) that:

1. Builds the library on pushes to `master` or manual dispatch.
2. Computes the next patch version based on the latest npm release.
3. Bumps `package.json` / `package-lock.json`, publishes to npm, and tags the commit.

Ensure `NPM_TOKEN` is defined in repository secrets to enable publishing.

---

## FAQ

**Can I use my own country dataset?**  
Yes. Pass an array of `CountryDefinition` objects; flags will be generated automatically when `flag` isn’t provided.

**How do I validate the number before submission?**  
Use the `phone-change` event payload. `detail.isValid` checks for basic length; combine with external libraries if you require advanced telecom validation.

**Does it work server-side?**  
Initialization requires `window`. If rendering on the server, hydrate the component in a `useEffect`/`onMounted` hook.

**What about RTL languages?**  
Set `language: "ar"` (or override via `translations`). The dropdown inherits document direction; customize with CSS if needed.

---

## Sponsor & license

Created with ❤️ by [Transfeero](https://www.transfeero.com) and friends.  
Offered by **LBD Srl** · [www.lbdsh.com](https://www.lbdsh.com)

This project is released under the [MIT License](LICENSE).
