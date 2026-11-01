import { describe, expect, it } from "vitest"
import {
    changedFields,
    deepEqual,
    formReducer,
    initialFormState,
    isValid,
    sameValue,
    shownErrors,
    type FormAction,
    type FormState,
} from "./form"

type Values = {
    phone: string
    districts: string[]
    segments: { start: string; end: string }[]
}

const saved: Values = {
    phone: "0501234567",
    districts: ["center", "south"],
    segments: [
        { start: "10:00", end: "11:00" },
        { start: "12:00", end: "13:00" },
    ],
}

const run = (state: FormState<Values>, ...actions: FormAction<Values>[]) =>
    actions.reduce(formReducer<Values>, state)

const changes = (state: FormState<Values>) => changedFields(state, state.values)

describe("form state", () => {
    it("starts clean, with the saved values", () => {
        const state = initialFormState(saved)
        expect(state.values).toBe(saved)
        expect(changes(state)).toEqual({})
    })

    it("compares lists in order, and as sets for unordered fields", () => {
        const swapped = {
            type: "set",
            field: "districts",
            value: ["south", "center"],
        } as const
        expect(changes(run(initialFormState(saved), swapped))).toEqual({
            districts: ["south", "center"],
        })
        expect(
            changes(run(initialFormState(saved, ["districts"]), swapped)),
        ).toEqual({})
    })

    it("compares lists of objects by their contents", () => {
        const state = initialFormState(saved)
        const sameContents = run(state, {
            type: "set",
            field: "segments",
            value: saved.segments.map((segment) => ({ ...segment })),
        })
        expect(changes(sameContents)).toEqual({})

        const later = run(state, {
            type: "update",
            field: "segments",
            change: (list: Values["segments"]) =>
                list.map((segment, index) =>
                    index === 1 ? { ...segment, end: "14:00" } : segment,
                ),
            path: "segments.1.end",
        })
        expect(changes(later)).toEqual({
            segments: [
                { start: "10:00", end: "11:00" },
                { start: "12:00", end: "14:00" },
            ],
        })
        expect(later.touched).toEqual(new Set(["segments.1.end"]))
    })

    it("takes new saved values where there are no unsaved edits, and keeps the edits", () => {
        const fresh = { ...saved, phone: "0507777777" }
        expect(
            run(initialFormState(saved), { type: "saved", values: fresh })
                .values,
        ).toBe(fresh)

        const after = run(
            initialFormState(saved),
            { type: "set", field: "districts", value: ["jerusalem"] },
            { type: "saved", values: fresh },
        )
        expect(after.values).toEqual({ ...fresh, districts: ["jerusalem"] })
        expect(changes(after)).toEqual({ districts: ["jerusalem"] })
    })

    it("takes the server's version of what a save sent, and keeps edits typed during the save", () => {
        const typed = run(initialFormState(saved), {
            type: "set",
            field: "phone",
            value: "0509999999",
        })
        const during = run(
            typed,
            { type: "sending", values: typed.values },
            // Typed while the save was on its way.
            { type: "set", field: "districts", value: ["haifa"] },
            // The server normalised the number it was sent.
            {
                type: "saved",
                values: { ...saved, phone: "+972509999999" },
            },
        )
        expect(during.values.phone).toBe("+972509999999")
        expect(during.values.districts).toEqual(["haifa"])
        expect(changes(during)).toEqual({ districts: ["haifa"] })
    })

    it("keeps unsaved values after a failed save, even when a refetch arrives", () => {
        const typed = run(initialFormState(saved), {
            type: "set",
            field: "phone",
            value: "0509999999",
        })
        const after = run(
            typed,
            { type: "sending", values: typed.values },
            { type: "sendFailed" },
            { type: "saved", values: { ...saved, phone: "0501111111" } },
        )
        expect(after.values.phone).toBe("0509999999")
        expect(changes(after)).toEqual({ phone: "0509999999" })
    })

    it("is clean once the saved values match the edits", () => {
        const after = run(
            initialFormState(saved),
            { type: "set", field: "phone", value: "0509999999" },
            { type: "saved", values: { ...saved, phone: "0509999999" } },
        )
        expect(changes(after)).toEqual({})
        expect(after.touched.size).toBe(0)
    })

    it("restores a draft as unsaved changes", () => {
        const draft = { ...saved, phone: "0508888888" }
        const after = run(initialFormState(saved), {
            type: "restore",
            values: draft,
        })
        expect(after.values).toBe(draft)
        expect(changes(after)).toEqual({ phone: "0508888888" })
        expect(after.touched).toEqual(new Set(["phone"]))
    })
})

describe("errors", () => {
    const errors = {
        phone: "badPhone",
        "segments.1.end": "endBeforeStart",
        "segments.0.start": "missing",
    }

    it("shows none of them before a save attempt, however much is touched", () => {
        const state = run(
            initialFormState(saved),
            { type: "touch", path: "segments.1.end" },
            { type: "set", field: "segments", value: [] },
        )
        expect(shownErrors(state, errors)).toEqual({})
    })

    it("shows all of them after a save attempt", () => {
        const state = run(initialFormState(saved), { type: "submit" })
        expect(shownErrors(state, errors)).toEqual(errors)
        expect(isValid(errors)).toBe(false)
        expect(isValid({ phone: undefined })).toBe(true)
    })

    it("shows the server's errors until their path is edited", () => {
        let state = run(initialFormState(saved), {
            type: "serverErrors",
            errors: { phone: "taken", "segments.1": "overlaps" },
        })
        expect(shownErrors(state, {})).toEqual({
            phone: "taken",
            "segments.1": "overlaps",
        })
        state = run(
            state,
            { type: "touch", path: "phone" },
            {
                type: "update",
                field: "segments",
                change: (list: Values["segments"]) => list,
                path: "segments.1.end",
            },
        )
        expect(shownErrors(state, {})).toEqual({ phone: "taken" })
        state = run(state, { type: "set", field: "phone", value: "x" })
        expect(shownErrors(state, {})).toEqual({})
    })
})

describe("sameValue", () => {
    it("compares deeply, lists in order unless unordered", () => {
        expect(sameValue(["a", "b"], ["b", "a"])).toBe(false)
        expect(sameValue(["a", "b"], ["b", "a"], true)).toBe(true)
        expect(sameValue(["a"], ["a", "a"], true)).toBe(false)
        expect(
            sameValue([{ a: 1 }, { a: 2 }], [{ a: 2 }, { a: 1 }], true),
        ).toBe(true)
        expect(sameValue([{ a: 1 }], [{ a: 2 }], true)).toBe(false)
        expect(sameValue("a", "a")).toBe(true)
    })

    it("tells objects in a list apart by their contents", () => {
        expect(deepEqual([{ a: 1 }], [{ a: 2 }])).toBe(false)
        expect(deepEqual([{ a: 1, b: [1] }], [{ b: [1], a: 1 }])).toBe(true)
        expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false)
        expect(deepEqual(null, {})).toBe(false)
    })
})
