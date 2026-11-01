import type { FormErrors } from "@ci-calendar/core/lib/form"
import { isWebUrl, normaliseWebUrl } from "@ci-calendar/core/lib/webUrl"

// The profile form's values and rules (legacy ProfileForm), pure. Fields
// are named as their `public_bio` columns, so a save's columns are the
// changed fields (links normalised).

export interface BioValues {
    bio_name: string
    about: string
    page_title: string
    page_url: string
    page_title_2: string
    page_url_2: string
}

const FIELDS: readonly (keyof BioValues)[] = [
    "bio_name",
    "about",
    "page_title",
    "page_url",
    "page_title_2",
    "page_url_2",
]

/** Legacy's `maxLength` on "about" (with its counter). */
export const ABOUT_MAX = 300
/** Legacy's limit on a link's title. */
export const LINK_TITLE_MAX = 30

export type BioError =
    | "nameRequired"
    | "titleTooLong"
    | "titleIsLink"
    | "titleRequired"
    | "invalidUrl"

/** The row's text as form values (`null` and missing as empty). */
export function bioValuesOf(
    row: Partial<Record<keyof BioValues, string | null>> | null,
): BioValues {
    return Object.fromEntries(
        FIELDS.map((field) => [field, row?.[field] ?? ""]),
    ) as unknown as BioValues
}

export const isBioValues = (value: unknown): value is BioValues =>
    typeof value === "object" &&
    value !== null &&
    FIELDS.every(
        (field) =>
            typeof (value as Record<string, unknown>)[field] === "string",
    )

/** Legacy's test for "this title is a link" (and its old URL rule). */
const LOOKS_LIKE_LINK = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/

function validateLink(
    errors: Record<string, BioError>,
    title: string,
    url: string,
    [titleField, urlField]: [keyof BioValues, keyof BioValues],
) {
    if (title.length > LINK_TITLE_MAX) errors[titleField] = "titleTooLong"
    else if (title && LOOKS_LIKE_LINK.test(title.trim())) {
        errors[titleField] = "titleIsLink"
    }
    if (!url.trim()) return
    if (!title.trim()) errors[urlField] = "titleRequired"
    else if (!isWebUrl(normaliseWebUrl(url))) errors[urlField] = "invalidUrl"
}

/**
 * Legacy ProfileForm's rules: a name; a link's title up to 30 characters
 * and not itself a link; a link needs a title and must be a web address
 * (http(s); typed without a scheme it gets `https://`, as the event forms'
 * links). Legacy checked the second link's title against the first link
 * (a slip); here each link needs its own title.
 */
export function validateBio(values: BioValues): FormErrors<BioError> {
    const errors: Record<string, BioError> = {}
    if (!values.bio_name.trim()) errors.bio_name = "nameRequired"
    validateLink(errors, values.page_title, values.page_url, [
        "page_title",
        "page_url",
    ])
    validateLink(errors, values.page_title_2, values.page_url_2, [
        "page_title_2",
        "page_url_2",
    ])
    return errors
}

/** A field's value as its column stores it (links normalised). */
const column = (field: keyof BioValues, value: string) =>
    field === "page_url" || field === "page_url_2"
        ? normaliseWebUrl(value)
        : value

/** The changed fields as `public_bio` columns: what an update sends. */
export function bioPatch(changes: Partial<BioValues>): Partial<BioValues> {
    return Object.fromEntries(
        FIELDS.filter((field) => changes[field] !== undefined).map((field) => [
            field,
            column(field, changes[field]!),
        ]),
    )
}

/**
 * A new bio's columns, as legacy's upsert sent them: every text field
 * (empty ones as `""`) and the photo (`img`, `""` without one).
 */
export function newBioColumns(values: BioValues, img: string) {
    return { ...bioPatch(values), img }
}
