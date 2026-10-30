/// <reference types="vite/client" />

/** Injected by Vite `define`; read it through `BUILD_VERSION`. */
declare const __BUILD_VERSION__: string

interface ImportMetaEnv {
    /** Languages offered, comma separated (`he,en,ru`); all when unset. */
    readonly VITE_LANGUAGES_TO_SHOW?: string
}
