/** Runs `run` once the page has loaded and the main thread is idle. */
export function afterLoadAndIdle(run: () => void): () => void {
    let cancel = () => {}
    const whenIdle = () => {
        if ("requestIdleCallback" in window) {
            const id = requestIdleCallback(run, { timeout: 5000 })
            cancel = () => cancelIdleCallback(id)
        } else {
            // Safari before 18.4 has no requestIdleCallback.
            const id = setTimeout(run, 1000)
            cancel = () => clearTimeout(id)
        }
    }
    if (document.readyState === "complete") {
        whenIdle()
    } else {
        window.addEventListener("load", whenIdle, { once: true })
        cancel = () => window.removeEventListener("load", whenIdle)
    }
    return () => cancel()
}
