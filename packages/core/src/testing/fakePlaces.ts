import type {
    PlaceSuggestion,
    PlacesApi,
    PlacesLoader,
} from "@ci-calendar/core/data/places"

// The fake's Google Places (`createFakeDataClient().places`, passed as
// `services.places`): seeded places, suggested when their label contains
// what was typed, and their English addresses. `loads` counts how often
// the app asked for the script, so tests can prove it isn't loaded until an
// address field is used; `calls` records each request with its session
// (a number per `session()`, `null` outside one).

export interface FakePlace extends PlaceSuggestion {
    /** The English address; without it the lookup fails. */
    english?: string
}

export type PlacesCall =
    | { method: "suggest"; input: string; session: number }
    | { method: "englishAddress"; placeId: string; session: number | null }

export interface FakePlaces {
    load: PlacesLoader
    /** How many times the app asked to load Places. */
    loads: number
    places: FakePlace[]
    calls: PlacesCall[]
    /** English lookups fail (Google down, or quota) until `healEnglish`. */
    failEnglish(): void
    healEnglish(): void
    /** English lookups never answer (a hung request) until `healEnglish`. */
    hangEnglish(): void
}

export function createFakePlaces(): FakePlaces {
    let english: "ok" | "fail" | "hang" = "ok"
    let sessions = 0
    const fake: FakePlaces = {
        loads: 0,
        places: [],
        calls: [],
        failEnglish: () => {
            english = "fail"
        },
        healEnglish: () => {
            english = "ok"
        },
        hangEnglish: () => {
            english = "hang"
        },
        load: async () => {
            fake.loads += 1
            return api
        },
    }
    const englishAddress = async (placeId: string, session: number | null) => {
        fake.calls.push({ method: "englishAddress", placeId, session })
        if (english === "hang") return new Promise<string>(() => {})
        const found = fake.places.find(
            (place) => place.placeId === placeId,
        )?.english
        if (english === "fail" || !found) throw new Error("NOT_FOUND")
        return found
    }
    const api: PlacesApi = {
        session() {
            const session = ++sessions
            return {
                async suggest(input) {
                    fake.calls.push({ method: "suggest", input, session })
                    return fake.places
                        .filter((place) => place.label.includes(input))
                        .map(({ placeId, label }) => ({ placeId, label }))
                },
                englishAddress: (placeId) => englishAddress(placeId, session),
            }
        },
        englishAddress: (placeId) => englishAddress(placeId, null),
    }
    return fake
}
