/// <reference types="vite/client" />
interface Window {
    cloudinary: any // You can replace 'any' with a more specific type if available
}

// Injected at build time from package.json via Vite `define` (see
// vite.config.ts / vitest.config.ts). The single source of truth for the app
// version. (#17)
declare const __APP_VERSION__: string
