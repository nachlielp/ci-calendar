import type { DataClient } from "../data/client"

// The single test seam: a fake of the data client that behaves like a tiny
// PostgREST. Seeded rows live per table; each query applies the top-level
// predicates it was built with (eq / gte / lte / order) and returns only the
// selected columns, so tests prove behaviour end to end — e.g. hidden rows
// seeded here never come back out of the public query, and a page reading a
// column its query didn't select sees `undefined`. Every request is recorded so
// tests can assert on what was asked of the backend. Nested (dotted)
// predicates are recorded, not applied.

type Row = Record<string, unknown>

export interface RecordedFilter {
    op: "eq" | "gte" | "lte"
    column: string
    value: unknown
}

export interface RecordedRequest {
    table: string
    select: string
    filters: RecordedFilter[]
    order: { column: string; ascending: boolean } | null
}

export interface FakeDataClient {
    client: DataClient
    requests: RecordedRequest[]
    /** Make every following request to `table` fail with `message`. */
    failTable(table: string, message: string): void
    /** Let requests to `table` succeed again. */
    healTable(table: string): void
}

function matches(row: Row, filter: RecordedFilter) {
    if (filter.column.includes(".")) return true
    const value = row[filter.column]
    if (filter.op === "eq") return value === filter.value
    if (value == null) return false
    return filter.op === "gte"
        ? String(value) >= String(filter.value)
        : String(value) <= String(filter.value)
}

/** Top-level names in a PostgREST select list, e.g. `a, b, c(d, e)` → a, b, c. */
function selectedColumns(select: string): string[] | null {
    if (select === "*") return null
    const columns: string[] = []
    let depth = 0
    let current = ""
    for (const char of select) {
        if (char === "(") depth++
        if (char === ")") depth--
        if (char === "," && depth === 0) {
            columns.push(current)
            current = ""
        } else {
            current += char
        }
    }
    columns.push(current)
    return columns.map((column) => column.split("(")[0].split(":").pop()!)
}

function project(row: Row, columns: string[] | null): Row {
    if (!columns) return { ...row }
    return Object.fromEntries(columns.map((column) => [column, row[column]]))
}

export function createFakeDataClient(
    seed: Record<string, Row[]> = {},
): FakeDataClient {
    const requests: RecordedRequest[] = []
    const failures = new Map<string, string>()

    function from(table: string) {
        const request: RecordedRequest = {
            table,
            select: "*",
            filters: [],
            order: null,
        }
        requests.push(request)

        const builder = {
            select(columns = "*") {
                request.select = columns.replace(/\s+/g, "")
                return builder
            },
            eq: (column: string, value: unknown) =>
                addFilter("eq", column, value),
            gte: (column: string, value: unknown) =>
                addFilter("gte", column, value),
            lte: (column: string, value: unknown) =>
                addFilter("lte", column, value),
            order(column: string, options: { ascending?: boolean } = {}) {
                request.order = {
                    column,
                    ascending: options.ascending ?? true,
                }
                return builder
            },
            then<T>(
                resolve: (result: {
                    data: Row[] | null
                    error: { message: string } | null
                }) => T,
                reject?: (reason: unknown) => T,
            ) {
                return Promise.resolve()
                    .then(() => execute(request))
                    .then(resolve, reject)
            },
        }

        function addFilter(
            op: RecordedFilter["op"],
            column: string,
            value: unknown,
        ) {
            request.filters.push({ op, column, value })
            return builder
        }

        return builder
    }

    function execute(request: RecordedRequest) {
        const failure = failures.get(request.table)
        if (failure) return { data: null, error: { message: failure } }

        let rows = (seed[request.table] ?? []).filter((row) =>
            request.filters.every((filter) => matches(row, filter)),
        )
        if (request.order) {
            const { column, ascending } = request.order
            rows = [...rows].sort((a, b) => {
                const result = String(a[column]).localeCompare(
                    String(b[column]),
                )
                return ascending ? result : -result
            })
        }
        const columns = selectedColumns(request.select)
        return { data: rows.map((row) => project(row, columns)), error: null }
    }

    return {
        client: { from } as unknown as DataClient,
        requests,
        failTable: (table, message) => {
            failures.set(table, message)
        },
        healTable: (table) => {
            failures.delete(table)
        },
    }
}
