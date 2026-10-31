import type { Language } from "./language"
import { plural, type PluralForms } from "./plural"

// Translated copy: every language's words for a component, side by side.
// See "Languages (i18n)" in docs/architecture.md.

const COUNTED = Symbol("counted")

/** A counted phrase; becomes `(count) => string` in its block's language. */
export interface Counted {
    readonly [COUNTED]: PluralForms
}

/**
 * A phrase with a count, e.g. `counted({ one: "one event", other: "# events" })`
 * (`#` is the count). The language's plural rules come from the block it is
 * in, so a block copied to another language can't keep the wrong rules.
 */
export const counted = (forms: PluralForms): Counted => ({ [COUNTED]: forms })

const isCounted = (value: unknown): value is Counted =>
    typeof value === "object" && value !== null && COUNTED in value

/** A copy block as components read it: counted phrases become functions. */
export type Resolved<T> = {
    readonly [K in keyof T]: T[K] extends Counted
        ? (count: number) => string
        : T[K]
}

/** Some copy in every language, as `useCopy` reads it. */
export type Copy<T> = Readonly<Record<Language, Resolved<T>>>

function resolve<T extends object>(language: Language, block: T): Resolved<T> {
    return Object.fromEntries(
        Object.entries(block).map(([key, value]) => [
            key,
            isCounted(value)
                ? (count: number) => plural(language, count, value[COUNTED])
                : value,
        ]),
    ) as Resolved<T>
}

/**
 * Declares a component's copy. The Hebrew block sets the shape; English and
 * Russian must match it key for key, so a missing translation is a type
 * error, not an untranslated key on screen. Entries are strings, `counted`
 * phrases, or functions (of names, counts…) returning a string or React
 * nodes, e.g. a sentence with a link in it. Read it with `useCopy`.
 */
export function defineCopy<T extends object>(copy: {
    he: T
    en: NoInfer<T>
    ru: NoInfer<T>
}): Copy<T> {
    return {
        he: resolve("he", copy.he),
        en: resolve("en", copy.en),
        ru: resolve("ru", copy.ru),
    }
}
