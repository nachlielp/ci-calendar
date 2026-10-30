import { describe, expect, it } from "vitest"
import { plural } from "./plural"

describe("plural", () => {
    const hebrew = new Intl.PluralRules("he")
    const events = { one: "אירוע אחד", other: "# אירועים" }

    it("picks the language's form for the count", () => {
        expect(plural(hebrew, 1, events)).toBe("אירוע אחד")
        expect(plural(hebrew, 5, events)).toBe("5 אירועים")
    })

    it("falls back to `other` for a form not given (Hebrew `two`)", () => {
        expect(hebrew.select(2)).toBe("two")
        expect(plural(hebrew, 2, events)).toBe("2 אירועים")
    })
})
