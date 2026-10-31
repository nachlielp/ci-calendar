// Google Places (`services.places`): address autocomplete for the event
// forms and the English address saved with an event (`en_label`). Legacy
// used react-google-places-autocomplete, which loads the Maps JavaScript API
// with the Places library (`AutocompleteService`) under
// `VITE_GOOGLE_PLACES_API_KEY`, and its own `PlacesService.getDetails` for
// the English address; the rewrite calls the same two services with the
// same key, so the key's API restrictions stay as they are, but in one
// billing session per search (the English address is fetched when a place
// is picked, with the suggestions' session token). Nothing loads until an
// address field is focused (or a save finds no English address to use).
// Google deprecated these two for new projects in favour of
// `AutocompleteSuggestion` and `Place.fetchFields` (Places API (New));
// moving to them is future work, and needs that API enabled on the key.
// It is a service, not an import, so tests count the loads (the fake's
// `places`) and never reach Google.

/** A place offered for what was typed. */
export interface PlaceSuggestion {
    placeId: string
    /** Google's description, in Hebrew (legacy's option label). */
    label: string
}

/**
 * One search in an address field, as Google bills it (an
 * `AutocompleteSessionToken`): the suggestions while typing, then the
 * picked place's English address, which ends the session.
 */
export interface PlacesSession {
    /** Places matching `input`, in Hebrew, biased to Israel (as legacy). */
    suggest(input: string): Promise<PlaceSuggestion[]>
    /** The picked place's formatted address in English; rejects if unknown. */
    englishAddress(placeId: string): Promise<string>
}

export interface PlacesApi {
    /** Starts a search (a new session token). */
    session(): PlacesSession
    /** A place's English address outside a search (a save's fallback). */
    englishAddress(placeId: string): Promise<string>
}

/**
 * Loads Google's script the first time it is called (later calls share
 * it); rejects without a key or when the script can't load, and a later
 * call tries again.
 */
export type PlacesLoader = () => Promise<PlacesApi>

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
