import js from "@eslint/js"
import tseslint from "typescript-eslint"

// The core is shared by the web app, its Cloudflare Worker and the mobile
// app, so it must not depend on any of their platforms. The compiler keeps
// the DOM and Node out (tsconfig.json); these rules keep the UI libraries
// out.

const PATHS = [
    {
        name: "@tanstack/react-query",
        message: "Use @tanstack/query-core: the core has no React.",
    },
    {
        name: "@supabase/supabase-js",
        message:
            "Use the sub-clients (postgrest-js, auth-js, …); supabase-js bundles realtime.",
    },
    {
        name: "@supabase/realtime-js",
        message: "The app has no realtime (spec #34).",
    },
]

const UI = {
    group: [
        "react",
        "react/*",
        "react-dom",
        "react-dom/*",
        "react-native",
        "react-native/*",
        "react-router",
        "react-router/*",
        "expo",
        "expo-*",
        "@expo/*",
    ],
    message:
        "The core has no UI: keep React, React Native and Expo code in the app that uses it.",
}

const APPS = {
    group: ["@ci-calendar/web", "@ci-calendar/web/*", "@ci-calendar/mobile"],
    message: "The apps depend on the core, not the other way round.",
}

// Only tests import Vitest: the fake backend kit (src/testing) is shared
// with the mobile app, which runs it under Jest.
const VITEST = {
    group: ["vitest", "vitest/*"],
    message:
        "Only tests import Vitest; the mobile app runs the core under Jest.",
}

const restrict = (patterns) => ["error", { paths: PATHS, patterns }]

export default tseslint.config(
    { ignores: ["node_modules"] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: { ecmaVersion: 2022, sourceType: "module" },
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                    caughtErrors: "none",
                },
            ],
            "no-restricted-imports": restrict([UI, APPS]),
        },
    },
    {
        files: ["src/**/*.ts"],
        ignores: ["src/**/*.test.ts"],
        rules: { "no-restricted-imports": restrict([UI, APPS, VITEST]) },
    },
)
