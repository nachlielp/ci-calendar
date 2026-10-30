/**
 * How long a save waits for a lookup it can do without (a translation, an
 * English address) before going on with the source text.
 */
export const LOOKUP_TIMEOUT_MS = 5000

/**
 * `promise`'s value, or `fallback` if it rejects or hasn't settled within
 * `ms`: for lookups that must never hold anything up.
 */
export function withTimeout<T, F>(
    promise: Promise<T>,
    fallback: F,
    ms = LOOKUP_TIMEOUT_MS,
): Promise<T | F> {
    let timer: ReturnType<typeof setTimeout> | undefined
    return Promise.race([
        promise.catch(() => fallback),
        new Promise<F>((resolve) => {
            timer = setTimeout(() => resolve(fallback), ms)
        }),
    ]).finally(() => clearTimeout(timer))
}
