import { withTimeout } from "../lib/timeout"
import type { PlacesLoader, PlacesSession } from "./places"

// The English addresses the event forms look up through Google Places
// (`services.places`, data/places.ts): never failing, never holding a save
// up longer than `LOOKUP_TIMEOUT_MS`, as the title's translations
// (data/translate.ts). Apart from places.ts, which `/` carries for the
// loader, so this stays in the forms' chunk.

/**
 * The place picked in `search`'s session in English, which ends the
 * session (the address field calls it on a pick), or `null` if Google
 * can't give it within `LOOKUP_TIMEOUT_MS`. Never rejects.
 */
export function pickedPlaceInEnglish(
    search: PlacesSession,
    placeId: string,
): Promise<string | null> {
    return withTimeout(search.englishAddress(placeId), null)
}

/**
 * `placeId`'s English address outside a search (a save whose address the
 * field couldn't label), or `undefined` if it can't be had within
 * `LOOKUP_TIMEOUT_MS`, loading Google's script included. Never rejects.
 */
export function englishAddressOf(
    places: PlacesLoader,
    placeId: string,
): Promise<string | undefined> {
    if (!placeId) return Promise.resolve(undefined)
    return withTimeout(
        places().then((loaded) => loaded.englishAddress(placeId)),
        undefined,
    )
}
