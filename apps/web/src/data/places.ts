import type { PlacesApi, PlacesLoader } from "@ci-calendar/core/data/places"

/** The production loader: the Maps script, imported on first use. */
export function googlePlacesLoader(apiKey: string | undefined): PlacesLoader {
    let loading: Promise<PlacesApi> | undefined
    return () =>
        (loading ??= (async () => {
            if (!apiKey) throw new Error("VITE_GOOGLE_PLACES_API_KEY is unset")
            const { loadGooglePlaces } = await import("./googlePlaces")
            return loadGooglePlaces(apiKey)
        })().catch((error: unknown) => {
            loading = undefined
            throw error
        }))
}
