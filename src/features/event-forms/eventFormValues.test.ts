import { describe, expect, it } from "vitest"
import { toManagedEvent, type ManagedEventRow } from "../events/managedEvent"
import { event, segment } from "../calendar/testEvents"
import {
    emptySingleDay,
    isSingleDayValues,
    singleDayColumns,
    singleDayPatch,
    singleDayValuesOf,
    taggedUserIds,
    validateSingleDay,
    type SingleDayValues,
} from "./eventFormValues"

const TEACHER_ID = "11111111-1111-4111-8111-111111111111"
const ORG_ID = "22222222-2222-4222-8222-222222222222"

function filled(overrides: Partial<SingleDayValues> = {}): SingleDayValues {
    return {
        ...emptySingleDay("2026-11-06"),
        title: "ג'אם",
        district: "center",
        address: { label: "הרצל 1", placeId: "P1" },
        segments: [
            {
                type: "jam",
                start: "19:00",
                end: "21:00",
                teachers: [{ label: "נועה", value: TEACHER_ID }],
                tags: ["everyone"],
            },
        ],
        ...overrides,
    }
}

describe("validateSingleDay", () => {
    it("requires legacy's fields, every segment's included", () => {
        const values = emptySingleDay("")
        values.segments.push({
            type: "",
            start: "",
            end: "",
            teachers: [],
            tags: [],
        })
        expect(validateSingleDay(values, "2026-10-30")).toEqual({
            title: "required",
            district: "required",
            address: "required",
            date: "required",
            "segments.0.type": "required",
            "segments.0.start": "required",
            "segments.0.end": "required",
            "segments.1.type": "required",
            "segments.1.start": "required",
            "segments.1.end": "required",
        })
    })

    it("requires link and price titles, links and numeric sums", () => {
        expect(
            validateSingleDay(
                filled({
                    links: [{ title: "", url: " " }],
                    prices: [
                        { title: "כניסה", sum: "" },
                        { title: "", sum: "abc" },
                    ],
                }),
                "2026-10-30",
            ),
        ).toEqual({
            "links.0.title": "required",
            "links.0.url": "required",
            "prices.0.sum": "required",
            "prices.1.title": "required",
            "prices.1.sum": "notANumber",
        })
    })

    it("refuses a past day, unless the event already had it", () => {
        const past = filled({ date: "2026-10-29" })
        expect(validateSingleDay(past, "2026-10-30")).toEqual({
            date: "datePast",
        })
        expect(validateSingleDay(past, "2026-10-30", "2026-10-29")).toEqual({})
        expect(validateSingleDay(filled(), "2026-10-30")).toEqual({})
    })
})

describe("singleDayColumns", () => {
    it("writes legacy's columns and JSON shapes", () => {
        expect(
            singleDayColumns(
                filled({
                    links: [{ title: "הרשמה", url: "https://x" }],
                    prices: [{ title: "כניסה", sum: "50" }],
                    organisations: [{ label: "סטודיו", value: ORG_ID }],
                }),
            ),
        ).toEqual({
            title: "ג'אם",
            description: "",
            district: "center",
            address: { label: "הרצל 1", place_id: "P1" },
            organisations: [{ label: "סטודיו", value: ORG_ID }],
            links: [{ title: "הרשמה", link: "https://x" }],
            price: [{ title: "כניסה", sum: 50 }],
            hide: false,
            start_date: "2026-11-06",
            end_date: "2026-11-06",
            segments: [
                {
                    startTime: "2026-11-06T17:00:00.000Z",
                    endTime: "2026-11-06T19:00:00.000Z",
                    type: "jam",
                    tags: ["everyone"],
                    teachers: [{ label: "נועה", value: TEACHER_ID }],
                },
            ],
            type: "",
            is_multi_day: false,
            multi_day_teachers: [],
        })
    })
})

describe("singleDayPatch", () => {
    it("has only what changed, with the segments when the date moves", () => {
        const values = filled({ title: "חדש", date: "2026-11-08" })
        expect(singleDayPatch(values, { title: "חדש" })).toEqual({
            title: "חדש",
        })
        const moved = singleDayPatch(values, { date: "2026-11-08" })
        expect(Object.keys(moved).sort()).toEqual([
            "end_date",
            "segments",
            "start_date",
        ])
        expect(moved.segments?.[0].startTime).toBe("2026-11-08T17:00:00.000Z")
        expect(singleDayPatch(values, { prices: [] })).toEqual({ price: [] })
        expect(
            singleDayPatch({ ...values, hidden: true }, { hidden: true }),
        ).toEqual({ hide: true })
    })
})

describe("taggedUserIds", () => {
    it("is every tagged user id once, not typed names", () => {
        expect(
            taggedUserIds(
                filled({
                    organisations: [
                        { label: "סטודיו", value: ORG_ID },
                        { label: "נועה", value: TEACHER_ID },
                    ],
                    segments: [
                        ...filled().segments,
                        {
                            type: "class",
                            start: "21:00",
                            end: "22:00",
                            teachers: [
                                { label: "אורחת", value: "אורחת" },
                                { label: "x", value: "NON_EXISTENT-1" },
                            ],
                            tags: [],
                        },
                    ],
                }),
            ),
        ).toEqual([TEACHER_ID, ORG_ID])
    })
})

describe("singleDayValuesOf", () => {
    it("reads a saved event back into the form", () => {
        const managed = toManagedEvent({
            ...event({
                user_id: "u1",
                start_date: "2026-11-03",
                price: [{ title: "כניסה", sum: 40 }],
                links: [{ title: "הרשמה", link: "https://x" }],
                segments: [
                    segment({
                        startTime: "2026-11-03T17:00:00.000Z",
                        endTime: "2026-11-03T19:30:00.000Z",
                        tags: ["beginner"],
                    }),
                ],
            }),
            ci_events_users_junction: [],
        } as unknown as ManagedEventRow)!
        const values = singleDayValuesOf(managed)
        expect(values).toMatchObject({
            date: "2026-11-03",
            address: { label: "תל אביב", placeId: "P1", enLabel: "Tel Aviv" },
            prices: [{ title: "כניסה", sum: "40" }],
            links: [{ title: "הרשמה", url: "https://x" }],
            segments: [
                {
                    type: "class",
                    start: "19:00",
                    end: "21:30",
                    teachers: [],
                    tags: ["beginner"],
                },
            ],
            hidden: false,
        })
        expect(isSingleDayValues(values)).toBe(true)
        // Saved unchanged, the address keeps its English label.
        expect(singleDayColumns(values).address).toEqual({
            label: "תל אביב",
            place_id: "P1",
            en_label: "Tel Aviv",
        })
    })
})

describe("isSingleDayValues", () => {
    it("accepts only the form's shape (drafts from storage)", () => {
        expect(isSingleDayValues(filled())).toBe(true)
        expect(isSingleDayValues({ title: "x" })).toBe(false)
        expect(isSingleDayValues({ ...filled(), segments: [{}] })).toBe(false)
        expect(isSingleDayValues(null)).toBe(false)
    })
})
