import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import jsxA11y from "eslint-plugin-jsx-a11y"

export default tseslint.config(
    {
        ignores: ["dist", "dev-dist", "stats.html", "node_modules", "public"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    jsxA11y.flatConfigs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: { ...globals.browser },
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
            // Destructuring to omit keys (`const { a, ...rest } = obj`) is a
            // deliberate pattern here; underscore-prefixed names opt out too.
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                    caughtErrors: "none",
                },
            ],
            // Downgraded to warnings, tracked for follow-up (do not regress):
            //   no-explicit-any  -> #24 (typed Supabase client removes most)
            //   jsx-a11y/*       -> dedicated accessibility pass
            "@typescript-eslint/no-explicit-any": "warn",
            "jsx-a11y/label-has-associated-control": "warn",
            "jsx-a11y/click-events-have-key-events": "warn",
            "jsx-a11y/no-static-element-interactions": "warn",
            "jsx-a11y/no-noninteractive-element-interactions": "warn",
        },
    },
    // Config files and plain-JS entry points run in a mixed Node/browser env.
    {
        files: ["**/*.js", "*.config.{js,ts}"],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
    },
)
