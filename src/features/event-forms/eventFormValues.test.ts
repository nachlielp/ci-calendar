import { describe, expect, it } from "vitest"
import { toManagedEvent, type ManagedEventRow } from "../events/managedEvent"
import { event, segment } from "../calendar/testEvents"
import {
    emptyMultiDay,
    emptySingleDay,
    isMultiDayValues,
    isSingleDayValues,
    multiDayColumns,
    multiDayPatch,
    multiDayValuesOf,
    newSingleDayColumns,
    seriesPatch,
    singleDayColumns,
    singleDayPatch,
    singleDayValuesOf,
    taggedUserIds,
    validateMultiDay,
    validateSingleDay,
    type MultiDayValues,
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

function multiDay(overrides: Partial<MultiDayValues> = {}): MultiDayValues {
    return {
        ...emptyMultiDay(),
        title: "ריטריט",
        district: "galilee",
        address: { label: "צופר", placeId: "P2", enLabel: "Tzofar" },
        startDate: "2026-11-19",
        endDate: "2026-11-21",
        type: "retreat",
        teachers: [
            { label: "נועה", value: TEACHER_ID },
            { label: "רותם רם", value: "רותם רם" },
        ],
        ...overrides,
    }
}

describe("validateMultiDay", () => {
    const TODAY = "2026-10-30"

    it("requires the shared fields, the type and both days", () => {
        expect(validateMultiDay(emptyMultiDay(), TODAY)).toEqual({
            title: "required",
            district: "required",
            address: "required",
            type: "required",
            startDate: "required",
            endDate: "required",
        })
        expect(validateMultiDay(multiDay(), TODAY)).toEqual({})
    })

    it("keeps legacy's span: after the first day, at most 14 days on", () => {
        const span = (startDate: string, endDate: string) =>
            validateMultiDay(multiDay({ startDate, endDate }), TODAY)
        expect(span("2026-11-19", "2026-11-18")).toEqual({
            endDate: "endBeforeStart",
        })
        expect(span("2026-11-19", "2026-11-19")).toEqual({ endDate: "sameDay" })
        expect(span("2026-11-19", "2026-12-03")).toEqual({})
        expect(span("2026-11-19", "2026-12-04")).toEqual({ endDate: "tooLong" })
    })

    it("refuses a first day that has passed, unless the event already had it", () => {
        const started = multiDay({
            startDate: "2026-10-28",
            endDate: "2026-11-02",
        })
        expect(validateMultiDay(started, TODAY)).toEqual({
            startDate: "datePast",
        })
        expect(
            validateMultiDay(started, TODAY, {
                startDate: "2026-10-28",
                endDate: "2026-10-31",
            }),
        ).toEqual({})
    })

    it("lets an edit keep the days it was saved with", () => {
        const long = multiDay({
            startDate: "2026-11-01",
            endDate: "2026-11-30",
        })
        expect(validateMultiDay(long, TODAY, long)).toEqual({})
        expect(
            validateMultiDay(long, TODAY, { ...long, endDate: "2026-11-29" }),
        ).toEqual({ endDate: "tooLong" })
    })
})

describe("multiDayColumns", () => {
    it("writes the columns legacy wrote for a multi-day event", () => {
        expect(multiDayColumns(multiDay())).toEqual({
            title: "ריטריט",
            description: "",
            district: "galilee",
            address: { label: "צופר", place_id: "P2", en_label: "Tzofar" },
            organisations: [],
            links: [],
            price: [],
            hide: false,
            start_date: "2026-11-19",
            end_date: "2026-11-21",
            segments: [],
            type: "retreat",
            is_multi_day: true,
            multi_day_teachers: [
                { label: "נועה", value: TEACHER_ID },
                { label: "רותם רם", value: "רותם רם" },
            ],
        })
    })

    it("tags the teachers and organisations, not typed names", () => {
        expect(
            taggedUserIds(
                multiDay({
                    organisations: [{ label: "סטודיו", value: ORG_ID }],
                }),
            ),
        ).toEqual([TEACHER_ID, ORG_ID])
    })
})

describe("multiDayPatch", () => {
    it("has only what changed", () => {
        const values = multiDay({ endDate: "2026-11-22", type: "workshop" })
        expect(multiDayPatch(values, { endDate: "2026-11-22" })).toEqual({
            end_date: "2026-11-22",
        })
        expect(multiDayPatch(values, { type: "workshop" })).toEqual({
            type: "workshop",
        })
        expect(multiDayPatch(values, { teachers: [] })).toEqual({
            multi_day_teachers: values.teachers,
        })
        expect(multiDayPatch(values, { title: "ריטריט" })).toEqual({
            title: "ריטריט",
        })
    })
})

describe("multiDayValuesOf", () => {
    it("reads a saved multi-day event back into the form", () => {
        const managed = toManagedEvent({
            ...event({
                user_id: "u1",
                is_multi_day: true,
                start_date: "2026-11-19",
                end_date: "2026-11-21",
                segments: [],
                type: "ריטריט",
                multi_day_teachers: [{ label: "נועה", value: TEACHER_ID }],
            }),
            hide: false,
            recurring_ref_key: null,
            ci_events_users_junction: [],
        } as unknown as ManagedEventRow)!
        const values = multiDayValuesOf(managed)
        expect(values).toMatchObject({
            startDate: "2026-11-19",
            endDate: "2026-11-21",
            // Legacy's Hebrew label, read as its value.
            type: "retreat",
            teachers: [{ label: "נועה", value: TEACHER_ID }],
        })
        expect(isMultiDayValues(values)).toBe(true)
        expect(isMultiDayValues(filled())).toBe(false)
        expect(isMultiDayValues({ ...values, teachers: [{}] })).toBe(false)
    })
})

describe("recurring single-day events", () => {
    const weekly = (until: string, date = "2026-10-16") =>
        filled({
            date,
            recurrence: { on: true, frequency: "weekly", until },
        })

    it("requires a frequency and an end day once it recurs", () => {
        expect(
            validateSingleDay(
                filled({
                    recurrence: { on: true, frequency: "", until: "" },
                }),
                "2026-10-15",
            ),
        ).toEqual({
            "recurrence.frequency": "required",
            "recurrence.until": "required",
        })
        // Off, what was chosen doesn't matter.
        expect(
            validateSingleDay(
                filled({
                    recurrence: {
                        on: false,
                        frequency: "",
                        until: "2020-01-01",
                    },
                }),
                "2026-10-15",
            ),
        ).toEqual({})
    })

    it("wants the end day from the first day to a year from today", () => {
        expect(validateSingleDay(weekly("2026-10-15"), "2026-10-15")).toEqual({
            "recurrence.until": "endBeforeStart",
        })
        expect(validateSingleDay(weekly("2027-10-15"), "2026-10-15")).toEqual(
            {},
        )
        expect(validateSingleDay(weekly("2027-10-16"), "2026-10-15")).toEqual({
            "recurrence.until": "tooFar",
        })
    })

    it("makes a row per day, its segments on its own day across the clock change", () => {
        const rows = newSingleDayColumns(weekly("2026-11-06"))
        expect(Array.isArray(rows)).toBe(true)
        const series = rows as ReturnType<typeof singleDayColumns>[]
        expect(series.map((row) => [row.start_date, row.end_date])).toEqual([
            ["2026-10-16", "2026-10-16"],
            ["2026-10-23", "2026-10-23"],
            ["2026-10-30", "2026-10-30"],
            ["2026-11-06", "2026-11-06"],
        ])
        // 19:00–21:00 in Jerusalem: UTC+3 until 25 October, then UTC+2.
        expect(
            series.map(({ segments: [first] }) => [
                first.startTime,
                first.endTime,
            ]),
        ).toEqual([
            ["2026-10-16T16:00:00.000Z", "2026-10-16T18:00:00.000Z"],
            ["2026-10-23T16:00:00.000Z", "2026-10-23T18:00:00.000Z"],
            ["2026-10-30T17:00:00.000Z", "2026-10-30T19:00:00.000Z"],
            ["2026-11-06T17:00:00.000Z", "2026-11-06T19:00:00.000Z"],
        ])
        expect(new Set(series.map((row) => row.title))).toEqual(
            new Set(["ג'אם"]),
        )
    })

    it("is one row when it doesn't recur", () => {
        expect(newSingleDayColumns(filled())).toEqual(
            singleDayColumns(filled()),
        )
    })

    it("changes a later event's shared columns, keeping its day, hide and cancellation", () => {
        const values = filled({
            title: "חדש",
            date: "2026-10-24",
            hidden: true,
            segments: [{ ...filled().segments[0], start: "18:00" }],
        })
        const patch = seriesPatch(
            values,
            {
                title: values.title,
                date: values.date,
                hidden: true,
                segments: values.segments,
            },
            { startDate: "2026-10-30" },
        )
        expect(patch).toEqual({
            title: "חדש",
            segments: [
                expect.objectContaining({
                    startTime: "2026-10-30T16:00:00.000Z",
                    endTime: "2026-10-30T19:00:00.000Z",
                }),
            ],
        })
        // Only a new date or hide: nothing for the later events.
        expect(
            seriesPatch(
                values,
                { date: values.date, hidden: true },
                { startDate: "2026-10-30" },
            ),
        ).toEqual({})
    })

    it("checks a draft's recurrence", () => {
        expect(
            isSingleDayValues({
                ...filled(),
                recurrence: { on: true, frequency: "daily", until: "" },
            }),
        ).toBe(false)
        expect(isSingleDayValues({ ...filled(), recurrence: undefined })).toBe(
            false,
        )
        expect(isSingleDayValues(weekly("2026-11-06"))).toBe(true)
    })
})
