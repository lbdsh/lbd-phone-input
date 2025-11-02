# lbd-phone-input

<p align="center">
  <a href="https://www.transfeero.com" target="_blank" rel="noopener">
    <img src="https://www.transfeero.com/wp-content/themes/tailpress-master/img/logo_transfeero_final.svg" alt="Transfeero" height="60" />
  </a>
</p>

> Ultra-flexible, framework-agnostic phone inputs with accessible country selectors, smart formatting and backend-friendly payloads.

lbd-phone-input is maintained and proudly sponsored by [Transfeero](https://www.transfeero.com), the premium airport transfer platform.

## Table of contents

- [Highlights](#highlights)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Flag display modes](#flag-display-modes)
- [Data binding & payloads](#data-binding--payloads)
- [Programmatic API](#programmatic-api)
- [Advanced scenarios](#advanced-scenarios)
  - [Prefilling from your backend](#prefilling-from-your-backend)
  - [Multiple inputs in one shot](#multiple-inputs-in-one-shot)
  - [Listening to the custom event](#listening-to-the-custom-event)
- [Styling & theming](#styling--theming)
- [Examples](#examples)
- [Asset credits](#asset-credits)
- [Contributing & license](#contributing--license)

## Highlights

- 🌍 **Flexible flag rendering** – pick between emoji flags, a high-quality PNG sprite, or hide flags entirely via `flagDisplay`.
- 🔁 **Automatic sprite distribution** – ships with retina-ready assets and class mapping adapted from `intl-tel-input`.
- ⚡ **Instant search & keyboard accessibility** – country lookup by name, ISO code or dial code with full keyboard support.
- 🧠 **Smart formatting** – auto-format numbers per country mask, fall back to national mode, or take control manually.
- 🔌 **Backend-ready payloads** – keep dial code and national number in sync with hidden inputs or pull a combined E.164 string on demand.
- 🛠️ **Tiny API surface** – no frameworks required, just vanilla TypeScript/JS that plays nicely with any UI stack.

## Installation

```bash
npm install lbd-phone-input
# or
yarn add lbd-phone-input
# or
pnpm add lbd-phone-input
```

The package targets modern browsers (ES2020) and requires Node 18+ for local tooling.

## Quick start

Include the distributed stylesheet, mount the input and listen for the `phone-change` event:

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
      import { createPhoneInput } from "lbd-phone-input";

      const controller = createPhoneInput("#phone", {
        preferredCountries: ["it", "gb", "us"],
        defaultCountry: "it",
        flagDisplay: "sprite", // emoji | sprite | none
        nationalMode: true,
        bindings: {
          dialCode: "#dial",
          nationalNumber: "#national",
          combined: "#full"
        }
      });

      document.querySelector("#phone").addEventListener("phone-change", ({ detail }) => {
        console.log("Current state", detail);
      });
    </script>
  </body>
</html>
```

## Flag display modes

Control how flags are rendered with the `flagDisplay` option:

```ts
createPhoneInput("#emoji", { flagDisplay: "emoji" });
createPhoneInput("#sprite", { flagDisplay: "sprite" });
createPhoneInput("#minimal", { flagDisplay: "none" });
```

When using the sprite mode you can supply custom asset URLs (e.g. when bundling with Vite/Webpack):

```ts
import spriteUrl from "lbd-phone-input/assets/flags.png";
import sprite2xUrl from "lbd-phone-input/assets/flags@2x.png";

createPhoneInput("#sprite", {
  flagDisplay: "sprite",
  flagSpriteUrl: spriteUrl,
  flagSpriteRetinaUrl: sprite2xUrl
});
```

CSS variables are also exposed if you prefer theming via stylesheets:

```css
.lbd-phone-input {
  --lbd-flag-sprite-url: url("/assets/flags.png");
  --lbd-flag-sprite-2x-url: url("/assets/flags@2x.png");
  --lbd-flag-sprite-size: 5652px 15px;
}
```

## Data binding & payloads

You choose how to send numbers to the server:

```ts
const input = createPhoneInput("#checkout-phone", {
  bindings: {
    dialCode: "#checkout-dial",
    nationalNumber: "#checkout-phone-national",
    combined: "#checkout-phone-e164"
  }
});

// On demand
const combined = input.getPayload(); // "+390123456789"
const split = input.getPayload("split");
// { dialCode: "+39", nationalNumber: "0123456789", formattedValue: "...", e164: "+390123456789" }
```

`phone-change` fires with the same payload, so any reactive framework can listen and sync state:

```ts
phoneElement.addEventListener("phone-change", ({ detail }) => {
  saveDraft({ phone: detail.e164, isValid: detail.isValid });
});
```

## Programmatic API

```ts
const controller = createPhoneInput("#phone");

controller.getCountry();      // Currently selected Country
controller.getDialCode();      // e.g. "+33"
controller.getNationalNumber();// sanitized national portion
controller.setCountry("us");   // switch selection
controller.setValue({ combined: "+4479460958" }); // prefill from backend
controller.getPayload("both"); // split payload + combined string
controller.destroy();          // restore the original <input>
```

## Advanced scenarios

### Prefilling from your backend

```ts
fetch("/api/profile/phone")
  .then((response) => response.json())
  .then(({ dialCode, nationalNumber }) => {
    controller.setValue({ dialCode, nationalNumber });
  });
```

If you only have an international format, pass it via `combined` – the country will be detected and pre-selected automatically.

### Multiple inputs in one shot

```ts
import { createPhoneInputs } from "lbd-phone-input";

const controllers = createPhoneInputs("input[data-phone]", {
  preferredCountries: ["de", "fr"],
  flagDisplay: "emoji"
});
```

### Listening to the custom event

Every change emits `CustomEvent<PhoneInputState>` on the original input:

```ts
input.addEventListener("phone-change", ({ detail }) => {
  console.debug(detail.country.iso2, detail.dialCode, detail.e164);
});
```

## Styling & theming

The distributed stylesheet is built with design tokens you can override per component:

```css
.lbd-phone-input {
  --lbd-border-radius: 16px;
  --lbd-border-color: rgba(15, 23, 42, 0.12);
  --lbd-option-hover: rgba(59, 130, 246, 0.12);
  --lbd-focus-ring: 0 0 0 4px rgba(99, 102, 241, 0.32);
}
```

Because the component is plain DOM, you can also wrap it with your favourite UI system (Tailwind, Chakra, etc.) or compose it inside Web Components.

## Examples

Clone the repository, install dependencies and build once to emit `dist/`:

```bash
npm install
npm run build
```

Then open [`examples/basic.html`](examples/basic.html) in your browser. The playground demonstrates:

- Switching between emoji, sprite and flagless modes.
- Two-way binding with discrete hidden inputs.
- Programmatic updates via `setValue`/`setCountry`.

## Asset credits

The PNG sprite (`flags.png` and `flags@2x.png`) and position map are adapted from the exceptional [intl-tel-input](https://github.com/jackocnr/intl-tel-input) project (MIT License).

## Contributing & license

Issues and pull requests are welcome! Run `npm run dev` for watch mode while developing.

This project is released under the [MIT License](LICENSE).
