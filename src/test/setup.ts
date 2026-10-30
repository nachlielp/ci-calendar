import "@testing-library/jest-dom"
import { focusManager, onlineManager } from "@tanstack/react-query"
import { configure } from "@testing-library/react"
import { afterEach } from "vitest"
import { clearTranslationMemory } from "../data/translate"
import { browserConditions, resetBrowserConditions } from "./browser"

// A test's first visit to a lazy route compiles its modules cold, which
// under load (several runs at once, CI) can take longer than Testing
// Library's 1 s default for `findBy…`/`waitFor`.
configure({ asyncUtilTimeout: 3000 })

// The app has no realtime by design (spec #34). Any code path that opens a
// socket — e.g. someone wiring up `@supabase/supabase-js` realtime — fails the
// test that triggers it.
globalThis.WebSocket = class {
    constructor() {
        throw new Error("WebSockets/realtime are not allowed (spec #34)")
    }
} as unknown as typeof WebSocket

// TanStack's online and focus managers are module singletons; a test that
// goes offline or hides the page must not leak that into the next test.
afterEach(() => {
    onlineManager.setOnline(true)
    focusManager.setFocused(undefined)
    // Drop per-test overrides, restoring jsdom's "visible" and online.
    delete (document as { visibilityState?: unknown }).visibilityState
    delete (navigator as { onLine?: unknown }).onLine
    // index.html's language, which a test that switched it must not leak.
    document.documentElement.lang = "he"
    document.documentElement.dir = "rtl"
    // Translations are remembered per session (data/translate.ts).
    clearTranslationMemory()
})

// jsdom has <dialog> but not its modal API. This stands in for what the
// browser does: `showModal()` opens it on top, Escape closes the topmost one,
// and `close()` fires the `close` event the app listens to.
const openModals: HTMLDialogElement[] = []
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true
    openModals.push(this)
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    if (!this.open) return
    this.open = false
    openModals.splice(openModals.indexOf(this), 1)
    this.dispatchEvent(new Event("close"))
}
document.addEventListener("keydown", (event) => {
    const top = openModals.filter((dialog) => dialog.isConnected).at(-1)
    if (event.key === "Escape" && top) top.close()
})
afterEach(() => {
    openModals.length = 0
})

// jsdom has no layout, so no media queries or scrolling. `matchMedia`
// answers width queries from `window.innerWidth` (1024 unless a test sets a
// phone width with `setViewportWidth`) and `display-mode: standalone` from
// `setStandalone` (a browser tab by default); React Router's scroll
// restoration calls `scrollTo`.
window.matchMedia = (query: string) => {
    const max = /max-width:\s*(\d+)px/.exec(query)
    const min = /min-width:\s*(\d+)px/.exec(query)
    const width = window.innerWidth
    const matches = max
        ? width <= Number(max[1])
        : min
          ? width >= Number(min[1])
          : query.includes("display-mode: standalone")
            ? browserConditions.standalone
            : false
    return {
        matches,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    }
}
window.scrollTo = () => {}
afterEach(resetBrowserConditions)
