import { describe, expect, it } from "vitest"
import {
    taggableOptions,
    type BioRow,
} from "@ci-calendar/core/features/event-forms/taggableBios"

const row = (overrides: Partial<BioRow>): BioRow => ({
    user_id: crypto.randomUUID(),
    bio_name: "מורה",
    user_type: "creator",
    allow_tagging: true,
    ...overrides,
})

describe("taggableOptions", () => {
    const teacher = row({ bio_name: "נועה" })
    const another = row({ bio_name: "אבי" })
    const org = row({ bio_name: "סטודיו", user_type: "org" })

    it("splits teachers from organisations, by name", () => {
        const options = taggableOptions([teacher, org, another], {
            id: "me",
            role: "creator",
            email: "me@x",
        })
        expect(options).toEqual({
            teachers: [
                { label: "אבי", value: another.user_id },
                { label: "נועה", value: teacher.user_id },
            ],
            organisations: [{ label: "סטודיו", value: org.user_id }],
            hasBio: false,
        })
    })

    it("offers the user's own bio first, even if it isn't taggable", () => {
        const own = row({
            user_id: "me",
            bio_name: "אני",
            allow_tagging: false,
        })
        const options = taggableOptions([teacher, own], {
            id: "me",
            role: "creator",
            email: "me@x",
        })
        expect(options.teachers[0]).toEqual({ label: "אני", value: "me" })
        expect(options.hasBio).toBe(true)
    })

    it("offers an org itself among organisations, by email without a bio", () => {
        const options = taggableOptions([org], {
            id: "me",
            role: "org",
            email: "org@x",
        })
        expect(options.organisations[0]).toEqual({
            label: "org@x",
            value: "me",
        })
        expect(options.teachers).toEqual([])
    })
})
