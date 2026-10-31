import { describe, it, expect } from "vitest"
import { initialChunks, lazyChunks, checkBudget } from "./bundle-size.mjs"

// Shape of Vite's build manifest (dist/.vite/manifest.json), trimmed.
const manifest = {
    "index.html": {
        file: "assets/index.js",
        isEntry: true,
        imports: ["_react.js", "_query.js"],
        dynamicImports: ["src/pages/NotFoundPage.tsx", "src/pages/Admin.tsx"],
        css: ["assets/index.css"],
    },
    "_react.js": { file: "assets/react.js" },
    "_query.js": { file: "assets/query.js", imports: ["_react.js"] },
    "_forms.js": { file: "assets/forms.js", imports: ["_react.js"] },
    "src/pages/NotFoundPage.tsx": {
        file: "assets/NotFoundPage.js",
        isDynamicEntry: true,
        imports: ["_react.js"],
    },
    "src/pages/Admin.tsx": {
        file: "assets/Admin.js",
        isDynamicEntry: true,
        imports: ["_react.js", "_forms.js"],
        // Lazy chunks may import each other back; must not loop.
        dynamicImports: ["src/pages/NotFoundPage.tsx"],
    },
}

describe("initialChunks", () => {
    it("is the entry plus everything it imports statically, each once", () => {
        expect(initialChunks(manifest).sort()).toEqual([
            "assets/index.js",
            "assets/query.js",
            "assets/react.js",
        ])
    })

    it("excludes lazily imported pages", () => {
        expect(initialChunks(manifest)).not.toContain("assets/Admin.js")
        expect(initialChunks(manifest)).not.toContain("assets/forms.js")
    })
})

describe("lazyChunks", () => {
    it("lists what each lazy page adds on top of the initial load", () => {
        expect(lazyChunks(manifest)).toEqual({
            "src/pages/NotFoundPage.tsx": ["assets/NotFoundPage.js"],
            "src/pages/Admin.tsx": ["assets/Admin.js", "assets/forms.js"],
        })
    })
})

describe("checkBudget", () => {
    it("passes at or under the limit", () => {
        expect(checkBudget(150 * 1024, 150).ok).toBe(true)
    })

    it("fails over the limit and says by how much", () => {
        const result = checkBudget(152 * 1024, 150)
        expect(result.ok).toBe(false)
        expect(result.message).toMatch(/152\.0 KB.*150 KB/)
    })
})
