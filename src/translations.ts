import { PhoneInputTranslations } from "./types";

const BASE_TRANSLATIONS: Record<string, PhoneInputTranslations> = {
  en: {
    searchPlaceholder: "Search country or code",
    dropdownPlaceholder: "Select a country",
    ariaLabelSelector: "Select country dial code",
    noResults: "No matches found"
  },
  it: {
    searchPlaceholder: "Cerca paese o prefisso",
    dropdownPlaceholder: "Seleziona un paese",
    ariaLabelSelector: "Seleziona il prefisso internazionale",
    noResults: "Nessun risultato"
  },
  es: {
    searchPlaceholder: "Buscar país o código",
    dropdownPlaceholder: "Selecciona un país",
    ariaLabelSelector: "Selecciona el prefijo internacional",
    noResults: "Sin coincidencias"
  },
  fr: {
    searchPlaceholder: "Rechercher un pays ou un indicatif",
    dropdownPlaceholder: "Sélectionner un pays",
    ariaLabelSelector: "Sélectionner l'indicatif international",
    noResults: "Aucun résultat"
  },
  de: {
    searchPlaceholder: "Land oder Vorwahl suchen",
    dropdownPlaceholder: "Land auswählen",
    ariaLabelSelector: "Ländervorwahl auswählen",
    noResults: "Keine Treffer"
  },
  pt: {
    searchPlaceholder: "Pesquisar país ou código",
    dropdownPlaceholder: "Selecione um país",
    ariaLabelSelector: "Selecione o código do país",
    noResults: "Nenhum resultado"
  },
  ru: {
    searchPlaceholder: "Поиск страны или кода",
    dropdownPlaceholder: "Выберите страну",
    ariaLabelSelector: "Выберите телефонный код",
    noResults: "Ничего не найдено"
  },
  zh: {
    searchPlaceholder: "搜索国家或区号",
    dropdownPlaceholder: "选择国家",
    ariaLabelSelector: "选择国家区号",
    noResults: "没有匹配项"
  },
  ja: {
    searchPlaceholder: "国名または国番号を検索",
    dropdownPlaceholder: "国を選択",
    ariaLabelSelector: "国番号を選択",
    noResults: "一致する結果はありません"
  },
  ar: {
    searchPlaceholder: "ابحث عن دولة أو رمز",
    dropdownPlaceholder: "اختر الدولة",
    ariaLabelSelector: "اختر رمز الدولة",
    noResults: "لا توجد نتائج"
  }
};

export const resolveTranslations = (
  language: string | undefined,
  overrides?: Partial<PhoneInputTranslations>
): PhoneInputTranslations => {
  const lang = (language ?? "en").toLowerCase();
  const baseKey = lang.split(/[\-_]/)[0];
  const base = BASE_TRANSLATIONS[baseKey] ?? BASE_TRANSLATIONS.en;
  return {
    ...base,
    ...(overrides ?? {})
  };
};

export type SupportedLanguageCode = keyof typeof BASE_TRANSLATIONS;
