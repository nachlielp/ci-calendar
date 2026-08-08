/**
 * Normalises an unknown thrown value into a readable message and rethrows it
 * wrapped with a human context string. Replaces the error block that used to be
 * copy-pasted into every service function — and, by not referencing the store,
 * keeps the data layer free of any dependency on the state layer. User identity
 * is attached to error reports at the Sentry layer instead (#7/#15).
 */
export function wrapServiceError(context: string, error: unknown): never {
    const message =
        error instanceof Error ? error.message : JSON.stringify(error, null, 2)
    throw new Error(`${context} ERROR: ${message}`)
}
