import { defineConfig } from "vitest/config"

// Plain Node: no DOM, as in production for the Worker and the mobile app.
export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        setupFiles: ["./vitest.setup.ts"],
        unstubEnvs: true,
    },
})
