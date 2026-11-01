/**
 * Crash reports and product analytics behind one small boundary
 * (`services.telemetry`): what every app reports. Each app adds its own
 * (the web's `Telemetry` follows its router and loads the vendors' SDKs
 * after the first paint).
 */
export interface CoreTelemetry {
    /**
     * Reports an error to Sentry, now or once the SDK loads. Each Error
     * object is reported once, however many places catch it.
     */
    captureError(error: unknown, context: ErrorContext): void
    /** Records a product event in PostHog. */
    track(event: string, properties?: Record<string, unknown>): void
    /**
     * The signed-in user (slice 9 calls it once the session is known):
     * Sentry gets `{ id, email }`, as legacy's `setUser`; PostHog gets
     * `identify(id)`, which joins this device's anonymous visitor to the
     * account (legacy kept PostHog's own anonymous id: its `reset()` ran
     * before `init` and was a no-op, and it identified the visitor with
     * that same id, which merges nothing and leaves it anonymous).
     */
    identify(user: TelemetryUser): void
    /** Sign-out: forget the user in Sentry and start a new PostHog visitor. */
    reset(): void
    /**
     * Saves legacy's `isInternal` device flag (`users.is_internal`, slice 9
     * after the profile loads). Marking the device internal stops PostHog
     * and Speed Insights at once; unmarking it takes effect from the next
     * page load.
     */
    setInternal(internal: boolean): void
}

export interface TelemetryUser {
    id: string
    email?: string
}

export interface ErrorContext {
    /**
     * Where it was caught, a Sentry tag: `window`, `rejection`, `route`,
     * `stale-chunk`, or a feature's own name.
     */
    source: string
    /** False for errors nothing handled (window, unhandled rejection). */
    handled?: boolean
}
