// Links people type (event links, bio pages) and the links the app renders.

const SCHEME = /^[a-z][a-z0-9+.-]*:/i

/**
 * A typed link as a web address: trimmed, `https://` added when it has no
 * scheme (`example.com/x`, `//example.com`). Other schemes stay as typed,
 * for `isWebUrl` to refuse.
 */
export function normaliseWebUrl(text: string): string {
    const url = text.trim()
    if (!url || SCHEME.test(url)) return url
    return `https://${url.replace(/^\/+/, "")}`
}

/** Whether `url` is an http(s) address with a host: safe as an `href`. */
export function isWebUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return (
            (parsed.protocol === "https:" || parsed.protocol === "http:") &&
            parsed.hostname !== ""
        )
    } catch {
        return false
    }
}
