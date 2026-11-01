import type { PlaceSuggestion, PlacesApi } from "@ci-calendar/core/data/places"

// The Maps JavaScript API's Places library, loaded with a script tag on
// first use (./places.ts imports this module then), in sessions
// (`AutocompleteSessionToken`). Only the two services legacy used: `AutocompleteService.getPlacePredictions` (what
// react-google-places-autocomplete called, with `language: "he"` and
// `region: "IL"`) and `PlacesService.getDetails` for the English address.
// Typed here by hand for those calls alone, rather than adding
// `@types/google.maps`.

interface Prediction {
    place_id: string
    description: string
}

interface PlacesLibrary {
    AutocompleteSessionToken: new () => object
    AutocompleteService: new () => {
        getPlacePredictions(
            request: {
                input: string
                language?: string
                region?: string
                sessionToken?: object
            },
            callback: (
                predictions: Prediction[] | null,
                status: string,
            ) => void,
        ): void
    }
    PlacesService: new (container: HTMLElement) => {
        getDetails(
            request: {
                placeId: string
                fields: string[]
                language?: string
                sessionToken?: object
            },
            callback: (
                result: { formatted_address?: string } | null,
                status: string,
            ) => void,
        ): void
    }
    PlacesServiceStatus: { OK: string; ZERO_RESULTS: string }
}

interface GoogleMaps {
    maps: {
        places?: PlacesLibrary
        importLibrary?: (name: "places") => Promise<PlacesLibrary>
    }
}

const CALLBACK = "__ciCalendarPlacesLoaded"

function loadScript(apiKey: string): Promise<GoogleMaps> {
    const loaded = (window as unknown as { google?: GoogleMaps }).google
    if (loaded?.maps) return Promise.resolve(loaded)
    return new Promise((resolve, reject) => {
        const params = new URLSearchParams({
            key: apiKey,
            libraries: "places",
            language: "he",
            region: "IL",
            loading: "async",
            callback: CALLBACK,
        })
        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?${params}`
        script.async = true
        const callbacks = window as unknown as Record<string, unknown>
        callbacks[CALLBACK] = () => {
            delete callbacks[CALLBACK]
            resolve((window as unknown as { google: GoogleMaps }).google)
        }
        script.onerror = () => {
            delete callbacks[CALLBACK]
            script.remove()
            reject(new Error("Google Places failed to load"))
        }
        document.head.append(script)
    })
}

export async function loadGooglePlaces(apiKey: string): Promise<PlacesApi> {
    const google = await loadScript(apiKey)
    const places =
        google.maps.places ?? (await google.maps.importLibrary?.("places"))
    if (!places) throw new Error("Google Places library missing")
    const autocomplete = new places.AutocompleteService()
    const details = new places.PlacesService(document.createElement("div"))
    const suggest = (input: string, sessionToken?: object) =>
        new Promise<PlaceSuggestion[]>((resolve, reject) =>
            autocomplete.getPlacePredictions(
                { input, language: "he", region: "IL", sessionToken },
                (predictions, status) => {
                    if (status === places.PlacesServiceStatus.ZERO_RESULTS)
                        resolve([])
                    else if (status !== places.PlacesServiceStatus.OK)
                        reject(new Error(`Places: ${status}`))
                    else
                        resolve(
                            (predictions ?? []).map((prediction) => ({
                                placeId: prediction.place_id,
                                label: prediction.description,
                            })),
                        )
                },
            ),
        )
    const englishAddress = (placeId: string, sessionToken?: object) =>
        new Promise<string>((resolve, reject) =>
            details.getDetails(
                {
                    placeId,
                    fields: ["formatted_address"],
                    language: "en",
                    sessionToken,
                },
                (result, status) =>
                    status === places.PlacesServiceStatus.OK &&
                    result?.formatted_address
                        ? resolve(result.formatted_address)
                        : reject(new Error(`Place details: ${status}`)),
            ),
        )
    return {
        session() {
            const token = new places.AutocompleteSessionToken()
            return {
                suggest: (input) => suggest(input, token),
                englishAddress: (placeId) => englishAddress(placeId, token),
            }
        },
        englishAddress: (placeId) => englishAddress(placeId),
    }
}
