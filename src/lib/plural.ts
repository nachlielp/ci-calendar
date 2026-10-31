import { INTL_LOCALES, LANGUAGES, type Language } from "./language"

/** A phrase for each plural category of a language; `#` is the count. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
    other: string
}

const RULES = Object.fromEntries(
    LANGUAGES.map((language) => [
        language,
        new Intl.PluralRules(INTL_LOCALES[language]),
    ]),
) as Record<Language, Intl.PluralRules>

/**
 * The phrase for `count` in `language` (Hebrew has `one`, `two` and
 * `other`; Russian `one`, `few`, `many` and `other`), falling back to
 * `other` for a category not given.
 */
export function plural(
    language: Language,
    count: number,
    forms: PluralForms,
): string {
    return (forms[RULES[language].select(count)] ?? forms.other).replace(
        "#",
        String(count),
    )
}
