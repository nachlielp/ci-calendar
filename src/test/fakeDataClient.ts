import type { DataClient } from "../data/client"

// The single test seam: a fake of the data client that behaves like a tiny
// PostgREST. Seeded rows live per table; each query applies the predicates it
// was built with (eq / neq / gte / lte / order) and returns only the selected
// columns, so tests prove behaviour end to end — e.g. hidden rows seeded here
// never come back out of the public query, and a page reading a column its
// query didn't select sees `undefined`. Embedded resources (`a, b(c, d)`)
// are joined through the foreign keys in RELATIONS, and dotted predicates
// (`b.c`) filter the embedded rows as PostgREST does: a filtered-out to-one
// embed is `null`, a to-many embed loses the rows, the parent row stays.
// `single()` / `maybeSingle()` return one row. Every request is recorded so
// tests can assert on what was asked of the backend. Requests to a table can
// be made to fail, or held until the test releases them (a slow network).

type Row = Record<string, unknown>

/**
 * The foreign keys the app embeds through, as in `database.types.ts`:
 * `RELATIONS[table][embedded]` joins `table.column` to `embedded.foreignColumn`.
 */
const RELATIONS: Record<string, Record<string, Relation>> = {
    ci_events: {
        ci_events_users_junction: {
            column: "id",
            foreignColumn: "ci_event_id",
            many: true,
        },
    },
    ci_events_users_junction: {
        public_bio: {
            column: "user_id",
            foreignColumn: "user_id",
            many: false,
        },
    },
}

interface Relation {
    column: string
    foreignColumn: string
    /** To-many embeds are arrays; to-one embeds are a row or `null`. */
    many: boolean
}

export interface RecordedFilter {
    op: "eq" | "neq" | "gte" | "lte"
    column: string
    value: unknown
}

export interface RecordedRequest {
    table: string
    select: string
    filters: RecordedFilter[]
    order: { column: string; ascending: boolean } | null
    /** Set by `single()` / `maybeSingle()`. */
    returns: "rows" | "single" | "maybeSingle"
}

export interface FakeDataClient {
    client: DataClient
    requests: RecordedRequest[]
    /** Make every following request to `table` fail with `message`. */
    failTable(table: string, message: string): void
    /** Let requests to `table` succeed again. */
    healTable(table: string): void
    /** Hold every following request to `table` until `releaseTable`. */
    holdTable(table: string): void
    /** Answer the held requests to `table`, and stop holding new ones. */
    releaseTable(table: string): void
}

function matches(row: Row, filter: RecordedFilter) {
    const value = row[filter.column]
    if (filter.op === "eq") return value === filter.value
    // SQL comparisons with NULL are never true.
    if (value == null) return false
    if (filter.op === "neq") return value !== filter.value
    return filter.op === "gte"
        ? String(value) >= String(filter.value)
        : String(value) <= String(filter.value)
}

/** A selected column (`children === null`) or embedded table. */
interface Field {
    /** The key in the result: the alias if there is one. */
    key: string
    name: string
    children: Field[] | null
}

/** Parses a PostgREST select list, e.g. `a, b:c, d(e, f(g))`; null for `*`. */
function parseSelect(select: string): Field[] | null {
    if (select === "*") return null
    const fields: Field[] = []
    let depth = 0
    let current = ""
    const push = () => {
        const open = current.indexOf("(")
        const head = open === -1 ? current : current.slice(0, open)
        const [alias, name = alias] = head.split(":")
        fields.push({
            key: alias,
            name,
            children:
                open === -1 ? null : parseSelect(current.slice(open + 1, -1)),
        })
        current = ""
    }
    for (const char of select) {
        if (char === "(") depth++
        if (char === ")") depth--
        if (char === "," && depth === 0) push()
        else current += char
    }
    push()
    return fields
}

export function createFakeDataClient(
    seed: Record<string, Row[]> = {},
): FakeDataClient {
    const requests: RecordedRequest[] = []
    const failures = new Map<string, string>()
    const held = new Map<string, (() => void)[]>()

    function from(table: string) {
        const request: RecordedRequest = {
            table,
            select: "*",
            filters: [],
            order: null,
            returns: "rows",
        }
        requests.push(request)

        const builder = {
            select(columns = "*") {
                request.select = columns.replace(/\s+/g, "")
                return builder
            },
            eq: (column: string, value: unknown) =>
                addFilter("eq", column, value),
            neq: (column: string, value: unknown) =>
                addFilter("neq", column, value),
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
            single() {
                request.returns = "single"
                return builder
            },
            maybeSingle() {
                request.returns = "maybeSingle"
                return builder
            },
            then<T>(
                resolve: (result: {
                    data: Row[] | Row | null
                    error: { message: string } | null
                }) => T,
                reject?: (reason: unknown) => T,
            ) {
                const waiting = held.get(table)
                const answered = waiting
                    ? new Promise<void>((answer) => waiting.push(answer))
                    : Promise.resolve()
                return answered
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

        /** The filters on the embed at `path` (`""` for the table itself). */
        const filtersAt = (path: string) =>
            request.filters.flatMap((filter) => {
                const dot = filter.column.lastIndexOf(".")
                const filterPath = dot === -1 ? "" : filter.column.slice(0, dot)
                return filterPath === path
                    ? [{ ...filter, column: filter.column.slice(dot + 1) }]
                    : []
            })
        const where = (table: string, path: string) =>
            (seed[table] ?? []).filter((row) =>
                filtersAt(path).every((filter) => matches(row, filter)),
            )

        function project(
            table: string,
            row: Row,
            fields: Field[] | null,
            path: string,
        ): Row {
            if (!fields) return { ...row }
            return Object.fromEntries(
                fields.map(({ key, name, children }) => {
                    if (!children) return [key, row[name]]
                    const relation = RELATIONS[table]?.[name]
                    if (!relation) {
                        throw new Error(`fake: no relation ${table} → ${name}`)
                    }
                    const embedPath = path ? `${path}.${name}` : name
                    const related = where(name, embedPath)
                        .filter(
                            (other) =>
                                other[relation.foreignColumn] ===
                                row[relation.column],
                        )
                        .map((other) =>
                            project(name, other, children, embedPath),
                        )
                    return [key, relation.many ? related : (related[0] ?? null)]
                }),
            )
        }

        let rows = where(request.table, "")
        if (request.order) {
            const { column, ascending } = request.order
            rows = [...rows].sort((a, b) => {
                const result = String(a[column]).localeCompare(
                    String(b[column]),
                )
                return ascending ? result : -result
            })
        }
        const fields = parseSelect(request.select)
        const data = rows.map((row) => project(request.table, row, fields, ""))
        if (request.returns === "rows") return { data, error: null }
        if (data.length > 1 || (request.returns === "single" && !data[0])) {
            return {
                data: null,
                error: {
                    message:
                        "JSON object requested, multiple (or no) rows returned",
                },
            }
        }
        return { data: data[0] ?? null, error: null }
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
        holdTable: (table) => {
            held.set(table, held.get(table) ?? [])
        },
        releaseTable: (table) => {
            const waiting = held.get(table) ?? []
            held.delete(table)
            for (const answer of waiting) answer()
        },
    }
}
