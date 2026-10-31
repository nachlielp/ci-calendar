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
    /**
     * The browser key for Google Places (address autocomplete, English
     * addresses); the event forms' address field can't search without it.
     */
    readonly VITE_GOOGLE_PLACES_API_KEY?: string
    /** `true`: new events start hidden (legacy's kill switch for publishing). */
    readonly VITE_HIDE_EVENTS_FLAG?: string
    /** `true`: every page shows "closed for maintenance" (app/AppDisabled). */
    readonly VITE_DISABLE_APP?: string
    /**
     * The Supabase Storage bucket bio photos go to (legacy's,
     * `ci_bio_profiles`); photo uploads fail without it.
     */
    readonly VITE_SUPABASE_STORAGE_BUCKET?: string
    /** PostHog's host; `https://app.posthog.com` when unset. */
    readonly VITE_PUBLIC_POSTHOG_HOST?: string
}
