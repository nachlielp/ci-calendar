import { describe, expect, it } from "vitest"
import { counted, defineCopy } from "./copy"

describe("defineCopy", () => {
    const copy = defineCopy({
        he: {
            title: "אירועים",
            events: counted({ one: "אירוע אחד", other: "# אירועים" }),
        },
        en: {
            title: "Events",
            events: counted({ one: "one event", other: "# events" }),
        },
        ru: {
            title: "События",
            events: counted({
                one: "# событие",
                few: "# события",
                many: "# событий",
                other: "# события",
            }),
        },
    })

    it("keeps plain entries as they are", () => {
        expect(copy.en.title).toBe("Events")
    })

    it("counts with the plural rules of the block's language", () => {
        expect(copy.he.events(2)).toBe("2 אירועים")
        expect(copy.en.events(1)).toBe("one event")
        expect(copy.ru.events(2)).toBe("2 события")
        expect(copy.ru.events(5)).toBe("5 событий")
    })
})
