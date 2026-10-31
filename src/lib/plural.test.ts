import { describe, expect, it } from "vitest"
import { plural } from "./plural"

describe("plural", () => {
    it("picks the language's form for the count", () => {
        const events = { one: "אירוע אחד", other: "# אירועים" }
        expect(plural("he", 1, events)).toBe("אירוע אחד")
        expect(plural("he", 5, events)).toBe("5 אירועים")
    })

    it("falls back to `other` for a form not given (Hebrew `two`)", () => {
        expect(plural("he", 2, { one: "אירוע אחד", other: "# אירועים" })).toBe(
            "2 אירועים",
        )
    })

    it("uses English's one/other", () => {
        const events = { one: "one event", other: "# events" }
        expect(plural("en", 1, events)).toBe("one event")
        expect(plural("en", 2, events)).toBe("2 events")
    })

    it("uses Russian's one/few/many", () => {
        const filters = {
            one: "# фильтр",
            few: "# фильтра",
            many: "# фильтров",
            other: "# фильтра",
        }
        expect(plural("ru", 1, filters)).toBe("1 фильтр")
        expect(plural("ru", 3, filters)).toBe("3 фильтра")
        expect(plural("ru", 5, filters)).toBe("5 фильтров")
        expect(plural("ru", 21, filters)).toBe("21 фильтр")
    })
})
