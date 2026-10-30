/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Languages offered, comma separated (`he,en,ru`); all when unset. */
    readonly VITE_LANGUAGES_TO_SHOW?: string
    /** The community WhatsApp number the header's logo opens a chat with. */
    readonly VITE_WHATSAPP_NUMBER?: string
    /** Sentry's DSN; no crash reports when unset (app/telemetry). */
    readonly VITE_SENTRY_DSN?: string
    /** PostHog's project key; no analytics when unset. */
    readonly VITE_PUBLIC_POSTHOG_KEY?: string
    /** PostHog's host; `https://app.posthog.com` when unset. */
    readonly VITE_PUBLIC_POSTHOG_HOST?: string
}
