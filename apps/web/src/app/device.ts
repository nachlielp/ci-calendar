// What kind of device and window the app runs in.

/** Running as the installed app (Android/desktop, or iOS's home screen). */
export function isStandalone(): boolean {
    return (
        window.matchMedia?.("(display-mode: standalone)").matches === true ||
        (navigator as { standalone?: boolean }).standalone === true
    )
}

export function isIos(): boolean {
    return /iPhone|iPad|iPod/.test(navigator.userAgent)
}
