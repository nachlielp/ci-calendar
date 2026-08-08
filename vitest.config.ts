import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import pkg from "./package.json"

export default defineConfig({
    plugins: [react()],
    // Mirror the app's build-time version injection so any code (or test) that
    // reads __APP_VERSION__ resolves to the same single source: package.json.
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
})
