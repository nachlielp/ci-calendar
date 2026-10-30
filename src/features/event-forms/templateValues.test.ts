import { describe, expect, it } from "vitest"
import { emptyMultiDay, emptySingleDay } from "./eventFormValues"
import {
    byNewest,
    emptyMultiDayTemplate,
    emptySingleDayTemplate,
    isMultiDayTemplateValues,
    isSingleDayTemplateValues,
    multiDayTemplateColumns,
    multiDayTemplatePatch,
    multiDayTemplateValuesOf,
    singleDayTemplateColumns,
    singleDayTemplatePatch,
    singleDayTemplateValuesOf,
    toTemplate,
    validateMultiDayTemplate,
    validateSingleDayTemplate,
    withMultiDayTemplate,
    withSingleDayTemplate,
    type TemplateListRow,
} from "./templateValues"

const TEACHER_ID = "6bcebbfd-814f-415d-a356-f1e5c51fe60d"
const ORG_ID = "0c4f5b7e-1d2a-4b8e-9a3c-2f6d8e7b1a90"

/** A single-day `templates` row as legacy's form wrote it. */
function singleDayRow(overrides: Partial<TemplateListRow> = {}) {
    return {
        id: "t1",
        name: "ג'אם שישי",
        created_at: "2026-10-01T10:00:00+00:00",
        is_multi_day: false,
        title: "ג'אם שישי בבוקר",
        description: "תיאור",
        district: "center",
        address: { label: "הרצל 1", place_id: "P1", en_label: "Herzl 1" },
        organisations: [{ label: "סטודיו", value: ORG_ID }],
        links: [{ title: "הרשמה", link: "https://x.example" }],
        price: [{ title: "כניסה", sum: 40 }],
        // Legacy wrote its segments on the day the template was saved.
        segments: [
            {
                type: "jam",
                startTime: "2025-03-02T08:00:00.000Z",
                endTime: "2025-03-02T10:30:00.000Z",
                tags: ["everyone"],
                teachers: [
                    { label: "נועה", value: TEACHER_ID },
                    { label: "רותם", value: "רותם" },
                ],
            },
        ],
        type: "",
        multi_day_teachers: [],
        ...overrides,
    } satisfies TemplateListRow
}

function multiDayRow(overrides: Partial<TemplateListRow> = {}) {
    return singleDayRow({
        id: "t2",
        name: "ריטריט קיץ",
        is_multi_day: true,
        title: "ריטריט במדבר",
        segments: [],
        // A legacy Hebrew multi-day type reads as its value.
        type: "ריטריט",
        multi_day_teachers: [{ label: "נועה", value: TEACHER_ID }],
        ...overrides,
    })
}

describe("toTemplate", () => {
    it("reads a single-day row as legacy's form filled it", () => {
        const template = toTemplate(singleDayRow())
        expect(template).toEqual({
            id: "t1",
            name: "ג'אם שישי",
            multiDay: false,
            createdAt: "2026-10-01T10:00:00+00:00",
            content: {
                title: "ג'אם שישי בבוקר",
                description: "תיאור",
                district: "center",
                address: {
                    label: "הרצל 1",
                    placeId: "P1",
                    enLabel: "Herzl 1",
                },
                organisations: [{ label: "סטודיו", value: ORG_ID }],
                links: [{ title: "הרשמה", url: "https://x.example" }],
                prices: [{ title: "כניסה", sum: "40" }],
                // Only the time of day: Jerusalem, whatever the day.
                segments: [
                    {
                        type: "jam",
                        start: "10:00",
                        end: "12:30",
                        tags: ["everyone"],
                        teachers: [
                            { label: "נועה", value: TEACHER_ID },
                            { label: "רותם", value: "רותם" },
                        ],
                    },
                ],
                type: "",
                teachers: [],
            },
        })
    })

    it("reads a multi-day row, and copes with empty columns", () => {
        expect(toTemplate(multiDayRow()).content).toMatchObject({
            type: "retreat",
            teachers: [{ label: "נועה", value: TEACHER_ID }],
            segments: [],
        })
        const bare = toTemplate({
            id: "t3",
            name: null,
            created_at: "2026-10-01T10:00:00+00:00",
            is_multi_day: null,
            title: null,
            description: null,
            district: null,
            address: null,
            organisations: [],
            links: null,
            price: null,
            segments: null,
            type: null,
            multi_day_teachers: null,
        })
        expect(bare).toMatchObject({ name: "", multiDay: false })
        expect(bare.content).toMatchObject({
            title: "",
            address: null,
            links: [],
            prices: [],
            segments: [],
        })
    })

    it("lists the newest first", () => {
        const older = toTemplate(singleDayRow({ id: "old" }))
        const newer = toTemplate(
            singleDayRow({ id: "new", created_at: "2026-10-20T10:00:00Z" }),
        )
        expect([older, newer].sort(byNewest).map(({ id }) => id)).toEqual([
            "new",
            "old",
        ])
    })
})

describe("the template forms", () => {
    it("require a name and the event's fields, but no day", () => {
        expect(validateSingleDayTemplate(emptySingleDayTemplate())).toEqual({
            name: "required",
            title: "required",
            district: "required",
            address: "required",
            "segments.0.type": "required",
            "segments.0.start": "required",
            "segments.0.end": "required",
        })
        expect(validateMultiDayTemplate(emptyMultiDayTemplate())).toEqual({
            name: "required",
            title: "required",
            district: "required",
            address: "required",
            type: "required",
        })
        const saved = singleDayTemplateValuesOf(toTemplate(singleDayRow()))
        expect(validateSingleDayTemplate(saved)).toEqual({})
        expect(validateSingleDayTemplate({ ...saved, name: "  " })).toEqual({
            name: "required",
        })
        expect(
            validateMultiDayTemplate(
                multiDayTemplateValuesOf(toTemplate(multiDayRow())),
            ),
        ).toEqual({})
    })

    it("write a single-day template as legacy did: no days, no hide, times on today", () => {
        const values = singleDayTemplateValuesOf(toTemplate(singleDayRow()))
        expect(singleDayTemplateColumns(values, "2026-10-30")).toEqual({
            name: "ג'אם שישי",
            title: "ג'אם שישי בבוקר",
            description: "תיאור",
            district: "center",
            address: { label: "הרצל 1", place_id: "P1", en_label: "Herzl 1" },
            organisations: [{ label: "סטודיו", value: ORG_ID }],
            links: [{ title: "הרשמה", link: "https://x.example" }],
            price: [{ title: "כניסה", sum: 40 }],
            segments: [
                {
                    type: "jam",
                    startTime: "2026-10-30T08:00:00.000Z",
                    endTime: "2026-10-30T10:30:00.000Z",
                    tags: ["everyone"],
                    teachers: [
                        { label: "נועה", value: TEACHER_ID },
                        { label: "רותם", value: "רותם" },
                    ],
                },
            ],
            type: "",
            is_multi_day: false,
            multi_day_teachers: [],
        })
    })

    it("write a multi-day template with its type and teachers", () => {
        const values = multiDayTemplateValuesOf(toTemplate(multiDayRow()))
        expect(multiDayTemplateColumns(values)).toMatchObject({
            name: "ריטריט קיץ",
            segments: [],
            type: "retreat",
            is_multi_day: true,
            multi_day_teachers: [{ label: "נועה", value: TEACHER_ID }],
        })
        expect(multiDayTemplateColumns(values)).not.toHaveProperty("hide")
    })

    it("patch only what changed", () => {
        const single = singleDayTemplateValuesOf(toTemplate(singleDayRow()))
        expect(
            singleDayTemplatePatch(
                { ...single, name: " חדש " },
                { name: " חדש " },
                "2026-10-30",
            ),
        ).toEqual({ name: "חדש" })
        expect(
            Object.keys(
                singleDayTemplatePatch(
                    single,
                    { segments: single.segments },
                    "2026-10-30",
                ),
            ),
        ).toEqual(["segments"])
        const multi = multiDayTemplateValuesOf(toTemplate(multiDayRow()))
        expect(
            multiDayTemplatePatch(
                { ...multi, type: "workshop", teachers: [] },
                { type: "workshop", teachers: [] },
            ),
        ).toEqual({ type: "workshop", multi_day_teachers: [] })
    })

    it("check a draft's shape", () => {
        expect(isSingleDayTemplateValues(emptySingleDayTemplate())).toBe(true)
        expect(isMultiDayTemplateValues(emptyMultiDayTemplate())).toBe(true)
        expect(isSingleDayTemplateValues(emptyMultiDayTemplate())).toBe(false)
        expect(
            isSingleDayTemplateValues({ ...emptySingleDayTemplate(), name: 1 }),
        ).toBe(false)
    })
})

describe("starting an event from a template", () => {
    it("fills a single-day event but its day, recurrence and hide", () => {
        const template = toTemplate(singleDayRow())
        const before = {
            ...emptySingleDay("2026-11-06", true),
            title: "טיוטה",
            recurrence: {
                on: true,
                frequency: "weekly" as const,
                until: "2026-12-01",
            },
        }
        const { type, teachers, ...filled } = template.content
        expect(withSingleDayTemplate(before, template)).toEqual({
            ...filled,
            date: "2026-11-06",
            hidden: true,
            recurrence: before.recurrence,
            sourceTemplateId: "t1",
        })
    })

    it("fills a multi-day event but its days and hide", () => {
        const template = toTemplate(multiDayRow())
        const before = {
            ...emptyMultiDay(),
            startDate: "2026-11-19",
            endDate: "2026-11-21",
        }
        const after = withMultiDayTemplate(before, template)
        expect(after).toMatchObject({
            title: "ריטריט במדבר",
            type: "retreat",
            teachers: [{ label: "נועה", value: TEACHER_ID }],
            organisations: [{ label: "סטודיו", value: ORG_ID }],
            startDate: "2026-11-19",
            endDate: "2026-11-21",
            hidden: false,
            sourceTemplateId: "t2",
        })
        expect(after).not.toHaveProperty("segments")
    })
})
