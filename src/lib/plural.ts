/** A phrase for each plural category of a language; `#` is the count. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
    other: string
}

/**
 * The phrase for `count` in the language of `rules` (e.g. Hebrew's `one`,
 * `two` and `other`), falling back to `other` for a category not given.
 */
export function plural(
    rules: Intl.PluralRules,
    count: number,
    forms: PluralForms,
): string {
    return (forms[rules.select(count)] ?? forms.other).replace(
        "#",
        String(count),
    )
}
