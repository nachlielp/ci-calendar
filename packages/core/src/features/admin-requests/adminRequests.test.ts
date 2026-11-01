import { describe, expect, it } from "vitest"
import { afterNewest } from "@ci-calendar/core/features/admin/adminLists"
import {
    actionPatch,
    APPROVED_NOTE,
    CLOSED_NOTE,
    requestedRole,
    requestsFilter,
    toAdminRequest,
    typesKey,
    withRequest,
    type AdminRequest,
    type RequestPages,
} from "@ci-calendar/core/features/admin-requests/adminRequests"

const NOW = new Date("2026-10-30T09:00:00Z")

function request(n: number, overrides: Partial<AdminRequest> = {}) {
    return {
        id: `r${n}`,
        number: n,
        createdAt: `2026-10-${String(n).padStart(2, "0")}T10:00:00+00:00`,
        userId: "u",
        type: "creator",
        closed: false,
        message: "",
        phone: "",
        email: "",
        name: "",
        responses: [],
        ...overrides,
    } satisfies AdminRequest
}

const cursorOf = (n: number) => {
    const { createdAt, id } = request(n)
    return { createdAt, id }
}

/**
 * Pages of requests numbered as given (newest first), each page's cursor
 * its last request as fetched (`cursors` overrides them: rows moved away
 * since); more follow the last if `more`.
 */
function pages(
    lists: number[][],
    more = false,
    cursors: (number | null)[] = [],
): RequestPages {
    return {
        pages: lists.map((numbers, i) => ({
            requests: numbers.map((n) => request(n)),
            next:
                i < lists.length - 1 || more
                    ? cursorOf(cursors[i] ?? numbers.at(-1)!)
                    : null,
        })),
        pageParams: lists.map(() => null),
    }
}

const numbers = (data: RequestPages) =>
    data.pages.map((page) => page.requests.map((r) => r.number))

describe("withRequest", () => {
    it("replaces a listed request in place", () => {
        const data = pages([[9, 7], [5]])
        const next = withRequest(data, request(7, { message: "new" }), true)
        expect(numbers(next)).toEqual([[9, 7], [5]])
        expect(next.pages[0].requests[1].message).toBe("new")
        expect(next.pages[1]).toBe(data.pages[1])
    })

    it("removes a request that no longer belongs", () => {
        const next = withRequest(pages([[9, 7], [5]]), request(7), false)
        expect(numbers(next)).toEqual([[9], [5]])
    })

    it("puts a request that now belongs in order, on the page it falls on", () => {
        expect(
            numbers(withRequest(pages([[9, 7], [5]]), request(6), true)),
        ).toEqual([
            [9, 7],
            [6, 5],
        ])
        expect(
            numbers(withRequest(pages([[9, 7], [5]]), request(10), true)),
        ).toEqual([[10, 9, 7], [5]])
        // Older than all, and the last page is loaded: at the end.
        expect(
            numbers(withRequest(pages([[9, 7], [5]]), request(2), true)),
        ).toEqual([
            [9, 7],
            [5, 2],
        ])
    })

    it("places by the page's cursor, not its last row shown", () => {
        // 7 was the page's last row, moved away and now back: "load more"
        // reads after 7, so it must go on this page or never show again.
        const data = pages([[9]], true, [7])
        expect(numbers(withRequest(data, request(7), true))).toEqual([[9, 7]])
        expect(numbers(withRequest(data, request(8), true))).toEqual([[9, 8]])
        expect(withRequest(data, request(6), true)).toBe(data)
    })

    it("places a request on a page emptied by moves", () => {
        const data = pages([[], [5]], false, [7])
        expect(numbers(withRequest(data, request(8), true))).toEqual([[8], [5]])
        expect(numbers(withRequest(data, request(6), true))).toEqual([
            [],
            [6, 5],
        ])
        expect(numbers(withRequest(pages([[]]), request(3), true))).toEqual([
            [3],
        ])
    })

    it("leaves one older than every loaded request to its own page", () => {
        const data = pages([[9, 7]], true)
        expect(withRequest(data, request(2), true)).toBe(data)
    })

    it("returns the same data when the request isn't there and doesn't belong", () => {
        const data = pages([[9, 7]])
        expect(withRequest(data, request(8), false)).toBe(data)
    })

    it("orders requests of the same moment by id, newest first", () => {
        const at = "2026-10-05T10:00:00+00:00"
        const data: RequestPages = {
            pages: [
                {
                    requests: [
                        request(1, { id: "c", createdAt: at }),
                        request(2, { id: "a", createdAt: at }),
                    ],
                    next: null,
                },
            ],
            pageParams: [null],
        }
        const next = withRequest(
            data,
            request(3, { id: "b", createdAt: at }),
            true,
        )
        expect(next.pages[0].requests.map((r) => r.id)).toEqual(["c", "b", "a"])
    })
})

describe("actionPatch", () => {
    const earlier = {
        response: "קודם",
        created_at: "2026-10-01T10:00:00Z",
        responder_name: "Admin",
    }

    it("appends a reply as legacy shaped responses, marked for the user", () => {
        expect(
            actionPatch(
                { kind: "reply", text: "נבדק" },
                [earlier],
                "Dana",
                NOW,
            ),
        ).toEqual({
            responses: [
                earlier,
                {
                    response: "נבדק",
                    created_at: NOW.toISOString(),
                    responder_name: "Dana",
                },
            ],
            viewed: false,
            sent: false,
            to_send: true,
        })
    })

    it("closes and approves with legacy's notes", () => {
        expect(actionPatch({ kind: "close" }, [], "Dana", NOW)).toEqual({
            responses: [
                {
                    response: CLOSED_NOTE,
                    created_at: NOW.toISOString(),
                    responder_name: "Dana",
                },
            ],
            viewed: false,
            sent: false,
            to_send: true,
            closed: true,
        })
        expect(
            actionPatch({ kind: "approve" }, [earlier], "Dana", NOW),
        ).toMatchObject({
            responses: [earlier, { response: APPROVED_NOTE }],
            closed: true,
        })
    })

    it("reopens without touching the responses", () => {
        expect(actionPatch({ kind: "reopen" }, [earlier], "Dana", NOW)).toEqual(
            { closed: false, status: "open" },
        )
    })
})

describe("request mapping", () => {
    it("maps the role requests to the role they ask for", () => {
        expect(requestedRole("profile")).toBe("profile")
        expect(requestedRole("creator")).toBe("creator")
        expect(requestedRole("org")).toBe("org")
        expect(requestedRole("support")).toBeNull()
        expect(requestedRole("toString")).toBeNull()
    })

    it("keys a type filter in one order", () => {
        expect(typesKey(["org", "profile", "nonsense"])).toEqual([
            "profile",
            "org",
        ])
    })

    it("is closed when `closed` is true or the status says so, as the user's page", () => {
        const row = {
            id: "r",
            number: 4,
            created_at: "2026-10-01T10:00:00Z",
            user_id: null,
            type: null,
            message: null,
            phone: null,
            email: null,
            name: null,
            responses: [],
        }
        expect(
            toAdminRequest({ ...row, closed: null, status: "open" }).closed,
        ).toBe(false)
        expect(
            toAdminRequest({ ...row, closed: true, status: "open" }).closed,
        ).toBe(true)
        expect(
            toAdminRequest({ ...row, closed: false, status: "closed" }).closed,
        ).toBe(true)
    })

    it("filters each list by the same rule, in one logic tree", () => {
        expect(requestsFilter("closed", null)).toBe(
            "closed.is.true,status.eq.closed",
        )
        expect(requestsFilter("open", null)).toBe(
            "status.is.null,status.neq.closed",
        )
        const cursor = { createdAt: "2026-10-01T10:00:00+00:00", id: "r1" }
        expect(requestsFilter("open", cursor)).toBe(
            `and(or(status.is.null,status.neq.closed),or(${afterNewest(cursor)}))`,
        )
    })

    it("reads a row", () => {
        expect(
            toAdminRequest({
                id: "r",
                number: 4,
                created_at: "2026-10-01T10:00:00Z",
                user_id: null,
                type: null,
                status: null,
                closed: null,
                message: null,
                phone: null,
                email: null,
                name: null,
                responses: [null, { response: "x" }],
            }),
        ).toEqual({
            id: "r",
            number: 4,
            createdAt: "2026-10-01T10:00:00Z",
            userId: null,
            type: "",
            closed: false,
            message: "",
            phone: "",
            email: "",
            name: "",
            responses: [{ response: "x", created_at: "", responder_name: "" }],
        })
    })
})
