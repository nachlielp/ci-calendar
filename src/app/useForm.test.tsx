import { act, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it } from "vitest"
import { setPageVisibility } from "../test/browser"
import { createFakeUpdates } from "../test/fakeUpdates"
import { renderApp } from "../test/renderApp"
import { useForm, type Submission } from "./useForm"

type Values = {
    name: string
    tags: string[]
    items: { start: string; end: string }[]
}

const SAVED: Values = {
    name: "Dana",
    tags: ["a", "b"],
    items: [
        { start: "10", end: "11" },
        { start: "12", end: "13" },
    ],
}

function validate(values: Values) {
    const errors: Record<string, string | undefined> = {}
    if (!values.name) errors.name = "required"
    values.items.forEach((item, index) => {
        if (item.end < item.start) errors[`items.${index}.end`] = "endFirst"
    })
    return errors
}

type Save = (
    submission: Submission<Values>,
    setSaved: (values: Values) => void,
) => Promise<unknown>

/** A form on `useForm`, saving through `save` (the test's backend). */
function TestForm({ save }: { save: Save }) {
    const [saved, setSaved] = useState(SAVED)
    const form = useForm({ saved, validate, unordered: ["tags"] })
    const { values } = form
    return (
        <form onSubmit={form.handleSubmit((s) => save(s, setSaved))}>
            <input
                aria-label="name"
                value={values.name}
                onChange={(event) => form.set("name", event.target.value)}
            />
            {values.items.map((item, index) => (
                <input
                    key={index}
                    aria-label={`end ${index}`}
                    value={item.end}
                    onChange={(event) =>
                        form.update(
                            "items",
                            (items) =>
                                items.map((other, at) =>
                                    at === index
                                        ? { ...other, end: event.target.value }
                                        : other,
                                ),
                            `items.${index}.end`,
                        )
                    }
                />
            ))}
            <ul aria-label="errors">
                {Object.entries(form.errors).map(([path, error]) => (
                    <li key={path}>{`${path}: ${error}`}</li>
                ))}
            </ul>
            <p>{form.isDirty ? "dirty" : "clean"}</p>
            <button type="submit">{form.submitting ? "saving" : "save"}</button>
            <button type="button" onClick={() => form.set("tags", ["b", "a"])}>
                swap tags
            </button>
            <button
                type="button"
                onClick={() => form.restore({ ...SAVED, name: "Draft" })}
            >
                restore
            </button>
            <button
                type="button"
                onClick={() => form.setErrors({ name: "taken" })}
            >
                server says no
            </button>
        </form>
    )
}

function deferred() {
    let resolve!: () => void
    let reject!: (error: Error) => void
    const promise = new Promise<void>((yes, no) => {
        resolve = yes
        reject = no
    })
    return { promise, resolve, reject }
}

function renderForm(
    save: Save,
    updates?: ReturnType<typeof createFakeUpdates>,
) {
    return renderApp({
        updates: updates?.updates,
        routes: [{ path: "/", element: <TestForm save={save} /> }],
    })
}

const errorsShown = () =>
    Array.from(
        screen.getByRole("list", { name: "errors" }).querySelectorAll("li"),
        (item) => item.textContent,
    )

const settle = () =>
    act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))

describe("useForm", () => {
    it("saves the latest values and what changed, once, however often it is submitted", async () => {
        const calls: Submission<Values>[] = []
        const pending = deferred()
        renderForm((submission) => {
            calls.push(submission)
            return pending.promise
        })

        await userEvent.type(screen.getByLabelText("name"), "!")
        await userEvent.click(screen.getByRole("button", { name: "save" }))
        await userEvent.click(screen.getByRole("button", { name: "saving" }))
        await userEvent.keyboard("{Enter}")

        expect(calls).toEqual([
            {
                values: { ...SAVED, name: "Dana!" },
                changes: { name: "Dana!" },
                isDirty: true,
            },
        ])
        await act(async () => pending.resolve())
        expect(screen.getByRole("button", { name: "save" })).toBeVisible()
    })

    it("sends nothing while a value is invalid, and shows every error", async () => {
        const calls: unknown[] = []
        renderForm(async (submission) => void calls.push(submission))

        await userEvent.clear(screen.getByLabelText("name"))
        expect(errorsShown()).toEqual(["name: required"])
        await userEvent.click(screen.getByRole("button", { name: "save" }))

        expect(calls).toEqual([])
    })

    it("keys errors by path, showing only the touched item's", async () => {
        renderForm(async () => {})

        await userEvent.clear(screen.getByLabelText("end 1"))
        await userEvent.type(screen.getByLabelText("end 1"), "0")

        expect(errorsShown()).toEqual(["items.1.end: endFirst"])
        expect(screen.getByText("dirty")).toBeVisible()
    })

    it("compares unordered fields as sets", async () => {
        renderForm(async () => {})

        await userEvent.click(screen.getByRole("button", { name: "swap tags" }))

        expect(screen.getByText("clean")).toBeVisible()
    })

    it("shows what the server stored, and keeps what was typed during the save", async () => {
        const pending = deferred()
        renderForm(async ({ values }, setSaved) => {
            await pending.promise
            // The response, as the mutation puts it in the cache.
            setSaved({ ...values, name: values.name.toUpperCase() })
        })

        await userEvent.type(screen.getByLabelText("name"), "!")
        await userEvent.click(screen.getByRole("button", { name: "save" }))
        // While the save is on its way:
        await userEvent.clear(screen.getByLabelText("end 0"))
        await userEvent.type(screen.getByLabelText("end 0"), "15")
        await act(async () => pending.resolve())

        await waitFor(() =>
            expect(screen.getByLabelText("name")).toHaveValue("DANA!"),
        )
        expect(screen.getByLabelText("end 0")).toHaveValue("15")
        expect(screen.getByText("dirty")).toBeVisible()
    })

    it("keeps the edits when the save fails", async () => {
        renderForm(async () => {
            throw new Error("offline")
        })

        await userEvent.type(screen.getByLabelText("name"), "!")
        await userEvent.click(screen.getByRole("button", { name: "save" }))

        await waitFor(() =>
            expect(screen.getByRole("button", { name: "save" })).toBeVisible(),
        )
        expect(screen.getByLabelText("name")).toHaveValue("Dana!")
        expect(screen.getByText("dirty")).toBeVisible()
    })

    it("restores a draft as unsaved work, which holds off reloads", async () => {
        const sw = createFakeUpdates()
        const { reloads } = renderForm(async () => {}, sw)

        await userEvent.click(screen.getByRole("button", { name: "restore" }))
        expect(screen.getByLabelText("name")).toHaveValue("Draft")
        expect(screen.getByText("dirty")).toBeVisible()

        sw.announce()
        setPageVisibility("hidden")
        setPageVisibility("visible")
        await settle()
        expect(reloads.count).toBe(0)
    })

    it("shows the server's errors until the field is edited", async () => {
        renderForm(async () => {})

        await userEvent.click(
            screen.getByRole("button", { name: "server says no" }),
        )
        expect(errorsShown()).toEqual(["name: taken"])

        await userEvent.type(screen.getByLabelText("name"), "a")
        expect(errorsShown()).toEqual([])
    })
})
