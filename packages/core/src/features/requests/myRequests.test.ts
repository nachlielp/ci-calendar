import { describe, expect, it } from "vitest"
import {
    offeredRequestTypes,
    openRequestOf,
    toUserRequest,
} from "@ci-calendar/core/features/requests/myRequests"

const row = {
    id: "r1",
    number: 3,
    created_at: "2026-10-01T10:00:00Z",
    type: "creator",
    status: "open",
    closed: false,
    message: "hi",
    phone: "0501234567",
    responses: [],
}

describe("offeredRequestTypes", () => {
    it("offers legacy's role requests except the role the user has", () => {
        expect(offeredRequestTypes("user")).toEqual(["creator", "org"])
        expect(offeredRequestTypes("profile")).toEqual(["creator", "org"])
        expect(offeredRequestTypes("creator")).toEqual(["org"])
        expect(offeredRequestTypes("org")).toEqual(["creator"])
    })
})

describe("toUserRequest", () => {
    it("is closed when an admin closed it, or its status says so", () => {
        expect(toUserRequest(row).closed).toBe(false)
        expect(toUserRequest({ ...row, closed: true }).closed).toBe(true)
        expect(
            toUserRequest({ ...row, closed: null, status: "closed" }).closed,
        ).toBe(true)
    })

    it("reads stored responses and skips ones that aren't objects", () => {
        const request = toUserRequest({
            ...row,
            message: null,
            responses: [
                { response: "ok", created_at: "x", responder_name: "Admin" },
                "stray",
                { response: "no name" },
            ],
        })
        expect(request.message).toBe("")
        expect(request.responses).toEqual([
            { response: "ok", created_at: "x", responder_name: "Admin" },
            { response: "no name", created_at: "", responder_name: "" },
        ])
    })
})

describe("openRequestOf", () => {
    it("is the newest request not closed", () => {
        const requests = [
            toUserRequest({ ...row, id: "new", closed: true }),
            toUserRequest({ ...row, id: "open" }),
            toUserRequest({ ...row, id: "older" }),
        ]
        expect(openRequestOf(requests)?.id).toBe("open")
        expect(openRequestOf([requests[0]])).toBeUndefined()
    })
})
