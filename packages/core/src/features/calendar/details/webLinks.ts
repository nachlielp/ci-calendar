import { isWebUrl, normaliseWebUrl } from "../../../lib/webUrl"

/**
 * The links that may be rendered as `href`s: web addresses only (a stored
 * `javascript:` or other scheme is dropped), a scheme-less one as https
 * (some older rows were saved as typed, `www.…`).
 */
export function webLinks<T extends { url: string }>(links: readonly T[]): T[] {
    return links.flatMap((link) => {
        const url = normaliseWebUrl(link.url)
        return isWebUrl(url) ? [{ ...link, url }] : []
    })
}
