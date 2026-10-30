import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
    plugins: [react()],
    // Tests get a fixed build version (see buildVersion in vite.config.ts).
    define: { __BUILD_VERSION__: JSON.stringify("test") },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.ts"],
        include: [
            "src/**/*.{test,spec}.{ts,tsx}",
            "scripts/**/*.{test,spec}.ts",
        ],
    },
})
