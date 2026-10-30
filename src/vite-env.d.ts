/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Languages offered, comma separated (`he,en,ru`); all when unset. */
    readonly VITE_LANGUAGES_TO_SHOW?: string
    /** The community WhatsApp number the header's logo opens a chat with. */
    readonly VITE_WHATSAPP_NUMBER?: string
}
