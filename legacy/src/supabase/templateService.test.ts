import { describe, it, expect, vi, beforeEach } from "vitest"

// Drive the service through the single seam — a fake Supabase client — instead
// of the network. `result` is the canned `{ data, error }` the fake query
// builder resolves to; each test sets it. Every builder method returns the
// builder, and the builder is thenable, so any query chain (.select().eq()...
// .single()) resolves to `result`.
const state = vi.hoisted(() => ({
    result: { data: null as unknown, error: null as unknown },
}))

vi.mock("./client", () => {
    const builder: unknown = new Proxy(function () {}, {
        get(_target, prop) {
            if (prop === "then") {
                return (resolve: (r: unknown) => void) => resolve(state.result)
            }
            return () => builder
        },
    })
    const supabase = {
        from: () => builder,
        storage: { from: () => builder },
    }
    return { supabase, createSupabaseClient: () => supabase }
})

import { templateService } from "./templateService"

beforeEach(() => {
    state.result = { data: null, error: null }
})

describe("templateService.getTemplate", () => {
    it("returns the first row for the given id", async () => {
        state.result = {
            data: [{ id: "t1", name: "Warmup", title: "Warmup jam" }],
            error: null,
        }

        const template = await templateService.getTemplate("t1")

        expect(template).toEqual({
            id: "t1",
            name: "Warmup",
            title: "Warmup jam",
        })
    })

    it("wraps a query error with context and the underlying message", async () => {
        state.result = { data: null, error: new Error("db exploded") }

        await expect(templateService.getTemplate("t1")).rejects.toThrow(
            /Failed to get CI template for templateId: t1 ERROR: db exploded/,
        )
    })
})

describe("templateService.createTemplate", () => {
    it("returns the inserted row", async () => {
        state.result = {
            data: [{ id: "new-id", name: "Created" }],
            error: null,
        }

        const created = await templateService.createTemplate({
            name: "Created",
        } as never)

        expect(created).toEqual({ id: "new-id", name: "Created" })
    })
})
