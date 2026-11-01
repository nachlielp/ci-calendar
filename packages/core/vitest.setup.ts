import { afterEach } from "vitest"
import { clearTranslationMemory } from "./src/data/translate"

// Translations are remembered per session (src/data/translate.ts): each
// test starts with none.
afterEach(clearTranslationMemory)
