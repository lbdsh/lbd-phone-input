import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createPhoneInput,
  createSplitPhoneInput,
  type PhoneInputController
} from "../src/index";

describe("lbd-phone-input", () => {
  let controller: PhoneInputController | null = null;

  beforeEach(() => {
    document.body.innerHTML = "";
    controller = null;
  });

  afterEach(() => {
    controller?.destroy();
    document.body.innerHTML = "";
  });

  it("initialises with smart placeholder and bindings", () => {
    document.body.innerHTML = `
      <input id="phone" type="tel" />
      <input id="dial" />
      <input id="national" />
      <input id="combined" />
    `;

    controller = createPhoneInput("#phone", {
      smartPlaceholder: true,
      bindings: {
        dialCode: "#dial",
        nationalNumber: "#national",
        combined: "#combined"
      }
    });

    const input = document.querySelector<HTMLInputElement>("#phone")!;
    expect(input.placeholder).toBe("347 12 12 456");
    const state = controller.getState();
    expect(state.dialCode).toBe("+39");
    expect(document.querySelector<HTMLInputElement>("#dial")!.value).toBe("+39");
  });

  it("emits phone-change events with payload", async () => {
    document.body.innerHTML = `
      <input id="phone" type="tel" />
    `;

    controller = createPhoneInput("#phone", {
      autoFormat: true
    });

    const input = document.querySelector<HTMLInputElement>("#phone")!;

    const payload = await new Promise<any>((resolve) => {
      input.addEventListener("phone-change", (event: Event) => {
        resolve((event as CustomEvent).detail);
      });

      controller!.setValue({ combined: "+442079460958" });
    });

    expect(payload.e164).toBe("+442079460958");
    expect(payload.dialCode).toBe("+44");
    expect(payload.nationalNumber).toBe("2079460958");
  });

  it("keeps the dial code out of the visible input when prefilling", () => {
    document.body.innerHTML = `
      <input id="phone" type="tel" />
    `;

    controller = createPhoneInput("#phone", {
      autoFormat: true
    });

    const input = document.querySelector<HTMLInputElement>("#phone")!;
    controller.setValue({ combined: "+442079460958" });
    const digitsOnly = input.value.replace(/\D/g, "");
    expect(digitsOnly).toBe("2079460958");
  });

  it("keeps the dial code out of the input when autoFormat is disabled", () => {
    document.body.innerHTML = `
      <input id="phone" type="tel" />
    `;

    controller = createPhoneInput("#phone", {
      autoFormat: false
    });

    const input = document.querySelector<HTMLInputElement>("#phone")!;
    controller.setValue({ combined: "+442079460958" });
    const digitsOnly = input.value.replace(/\D/g, "");
    expect(digitsOnly).toBe("2079460958");
  });

  it("updates placeholder when country changes", () => {
    document.body.innerHTML = `
      <input id="phone" type="tel" />
    `;

    controller = createPhoneInput("#phone");
    const input = document.querySelector<HTMLInputElement>("#phone")!;

    controller.setCountry("us");
    expect(input.placeholder).toContain("(201) 555-0123");

    controller.setCountry("fr");
    expect(input.placeholder).toContain("06 12 34 56 78");
  });

  it("applies translations when language is provided", () => {
    document.body.innerHTML = `
      <input id="phone" type="tel" />
    `;

    controller = createPhoneInput("#phone", { language: "fr" });
    const searchField = document.querySelector<HTMLInputElement>(".lbd-phone-input__search")!;
    expect(searchField.placeholder).toBe("Rechercher un pays ou un indicatif");
  });

  it("supports split input helper", () => {
    document.body.innerHTML = `
      <input id="dial" />
      <input id="number" />
      <input id="combined" />
    `;

    controller = createSplitPhoneInput({
      dialCode: "#dial",
      nationalNumber: "#number",
      combined: "#combined"
    });

    const dial = document.querySelector<HTMLInputElement>("#dial")!;
    dial.value = "+1";
    dial.dispatchEvent(new Event("input"));
    expect(controller.getCountry().iso2).toBe("us");

    dial.value = "+44";
    dial.dispatchEvent(new Event("input"));
    expect(controller.getCountry().iso2).toBe("gb");
  });

  it("formats national mode values", () => {
    document.body.innerHTML = `
      <input id="phone" type="tel" />
    `;

    controller = createPhoneInput("#phone", {
      nationalMode: true,
      autoFormat: true
    });

    controller.setCountry("us");
    controller.setValue({ nationalNumber: "2015550123" });
    const state = controller.getState();
    expect(state.formattedValue).toBe("(201) 555-0123");
  });

  it("respects dropdown close toggle", () => {
    document.body.innerHTML = `
      <input id="phone" type="tel" />
    `;

    controller = createPhoneInput("#phone", {
      closeDropdownOnSelection: false
    });

    expect(controller.getState().country.iso2).toBe("it");
  });

  it("accepts custom country dataset", () => {
    document.body.innerHTML = `<input id="phone" type="tel" />`;

    controller = createPhoneInput("#phone", {
      countries: [
        { iso2: "xx", name: "Testland", dialCode: "+123", mask: "### ###", example: "123 456" }
      ],
      preferredCountries: ["xx"],
      defaultCountry: "xx"
    });

    const state = controller.getState();
    expect(state.dialCode).toBe("+123");
    const input = document.querySelector<HTMLInputElement>("#phone")!;
    expect(input.placeholder).toBe("123 456");
  });

  it("supports translation overrides", () => {
    document.body.innerHTML = `<input id="phone" type="tel" />`;

    controller = createPhoneInput("#phone", {
      translations: {
        searchPlaceholder: "Buscar"
      }
    });

    const searchField = document.querySelector<HTMLInputElement>(".lbd-phone-input__search")!;
    expect(searchField.placeholder).toBe("Buscar");
  });

  it("updates bindings after setValue", () => {
    document.body.innerHTML = `
      <input id="phone" type="tel" />
      <input id="dial" />
      <input id="national" />
      <input id="combined" />
    `;

    controller = createPhoneInput("#phone", {
      bindings: {
        dialCode: "#dial",
        nationalNumber: "#national",
        combined: "#combined"
      }
    });

    controller.setValue({ combined: "+551191234567" });
    expect(document.querySelector<HTMLInputElement>("#dial")!.value).toBe("+55");
    expect(document.querySelector<HTMLInputElement>("#national")!.value).toBe("1191234567");
    expect(document.querySelector<HTMLInputElement>("#combined")!.value).toBe("+551191234567");
  });
});
