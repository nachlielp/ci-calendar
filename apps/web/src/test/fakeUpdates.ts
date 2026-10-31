import { act } from "@testing-library/react"
import type { AppUpdates } from "../app/updates/updates"

/**
 * A stand-in for the service worker (`AppUpdates`): `announce()` reports a
 * new version as installed; `activations` counts the times the app handed
 * the page to it, and `watching` says whether the app is still listening.
 */
export function createFakeUpdates() {
    let onReady: ((activate: () => Promise<void>) => void) | undefined
    const fake = {
        activations: 0,
        watching: false,
        updates: {
            watch(listener) {
                onReady = listener
                fake.watching = true
                return () => {
                    fake.watching = false
                }
            },
        } satisfies AppUpdates,
        /** A new version has installed and is waiting to take over. */
        announce() {
            act(() => {
                onReady?.(async () => {
                    fake.activations += 1
                })
            })
        },
    }
    return fake
}
