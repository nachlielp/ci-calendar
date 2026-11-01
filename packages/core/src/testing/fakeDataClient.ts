import type { DataClient } from "@ci-calendar/core/data/client"
import { createFakeAuth, type FakeAuth } from "./fakeAuth"
import { createFakeFiles, type FakeFiles } from "./fakeFiles"
import { createFakeFunctions, type FakeFunctions } from "./fakeFunctions"
import { createFakeImages, type FakeImages } from "./fakeImages"
import { createFakePlaces, type FakePlaces } from "./fakePlaces"
import { createFakeRpc, type FakeRpc } from "./fakeRpc"

// The single test seam: a fake of the data client that behaves like a tiny
// PostgREST. Seeded rows live per table; each query applies the predicates it
// was built with (eq / neq / lt / lte / gt / gte / in / or, then order,
// limit and range) and returns only the selected
// columns, so tests prove behaviour end to end — e.g. hidden rows seeded here
// never come back out of the public query, and a page reading a column its
// query didn't select sees `undefined`. Embedded resources (`a, b(c, d)`)
// are joined through the foreign keys in RELATIONS, and dotted predicates
// (`b.c`) filter the embedded rows as PostgREST does: a filtered-out to-one
// embed is `null`, a to-many embed loses the rows, the parent row stays.
// `is` and `not(column, "is", value)` are SQL's IS (`closed IS NOT TRUE`).
// `or("a.lt.1,and(a.eq.1,b.lt.2)")` takes PostgREST's logic-tree syntax
// (for keyset pagination). `single()` / `maybeSingle()` return one row.
// `delete()` removes the filtered rows and returns them (refused with
// `23503` while a row in REFERENCED_BY still points at one). Every request is
// recorded so
// tests can assert on what was asked of the backend, with the token it was
// sent with. `insert(row).select().single()` adds a row (and returns it as
// stored, with its serial number, SERIAL_COLUMNS). Requests to a table
// can be made to fail, or held until the test releases them (a slow
// network). `insert([rows])` adds several (`ci_events_users_junction`).
// `auth` is the fake's Supabase auth (./fakeAuth.ts), `functions` its Edge
// Functions (./fakeFunctions.ts), `places` stands in for Google Places
// (./fakePlaces.ts), `files` for Supabase Storage (./fakeFiles.ts),
// `images` for the cropper and the canvas (./fakeImages.ts) and `rpc` for
// the database's functions (`rpc(name, args)`, ./fakeRpc.ts).
// `ilike` takes PostgREST's `*` wildcard, at the top level and in `or()`,
// whose values may be double-quoted (`a.ilike."*x, y*"`, `\` escapes).
// `select(columns, { count: "exact", head })` answers with the `count` of
// the filtered rows (before `limit`/`range`) and, with `head`, no rows.

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
        // The event's creator (`ci_events_user_id_fkey`).
        users: { column: "user_id", foreignColumn: "id", many: false },
    },
    ci_events_users_junction: {
        public_bio: {
            column: "user_id",
            foreignColumn: "user_id",
            many: false,
        },
    },
    // `user_roles.user_id` is unique: a one-to-one embed.
    users: {
        user_roles: { column: "id", foreignColumn: "user_id", many: false },
    },
}

/**
 * Columns the database fills from a sequence on insert, as
 * `database.types.ts` shows them optional on Insert (`requests.number`).
 */
const SERIAL_COLUMNS: Record<string, string> = { requests: "number" }

/**
 * Foreign keys the fake enforces on insert, as Postgres does (`23503`) —
 * the ones a stale client value can break: `ci_events.source_template_id`
 * (a draft naming a template deleted since). What a delete of the
 * referenced row does isn't modelled (the rule isn't known).
 */
const FOREIGN_KEYS: Record<
    string,
    { column: string; references: string; constraint: string }[]
> = {
    ci_events: [
        {
            column: "source_template_id",
            references: "templates",
            constraint: "ci-events_source_template_id_fkey",
        },
    ],
}

/**
 * Foreign keys referencing a table that the fake enforces on delete, as
 * Postgres' default rule (NO ACTION, as docs/database-schema.md shows the
 * constraint): deleting a row still referenced fails with `23503` and
 * deletes nothing. `ci_events_users_junction.ci_event_id`: a tagged event
 * can't be deleted before its tags (the live rule isn't known; the client
 * copes with either).
 */
const REFERENCED_BY: Record<
    string,
    { table: string; column: string; constraint: string }[]
> = {
    ci_events: [
        {
            table: "ci_events_users_junction",
            column: "ci_event_id",
            constraint: "ci_events_users_junction_ci_event_id_fkey",
        },
    ],
}

/**
 * Unique columns besides `id`, as the database's constraints: an insert
 * repeating one fails with `23505` (`public_bio.user_id`: one bio per user,
 * legacy's upsert `onConflict`).
 */
const UNIQUE_COLUMNS: Record<string, string[]> = { public_bio: ["user_id"] }

interface Relation {
    column: string
    foreignColumn: string
    /** To-many embeds are arrays; to-one embeds are a row or `null`. */
    many: boolean
}

export interface RecordedFilter {
    /**
     * `is` / `not.is`: SQL's `IS` (`IS NOT TRUE` matches null too). `or`:
     * `value` is PostgREST's logic tree (`a.lt.1,and(a.eq.1,b.lt.2)`), and
     * `column` is empty.
     */
    op:
        | "eq"
        | "neq"
        | "lt"
        | "lte"
        | "gt"
        | "gte"
        | "in"
        | "ilike"
        | "is"
        | "not.is"
        | "or"
    column: string
    value: unknown
}

export interface RecordedRequest {
    table: string
    /** `select` unless the request writes. */
    method: "select" | "insert" | "update" | "delete"
    /** The row an insert sent, or the values an update set. */
    body?: Row
    /** The rows a multi-row insert (`insert([...])`) sent. */
    rows?: Row[]
    /**
     * The access token the request carried when it was sent; `null` for the
     * anon key (signed out, or the token at hand had expired).
     */
    token: string | null
    select: string
    /** Set by `select(columns, { count })`: the rows matched are counted. */
    count: "exact" | "planned" | "estimated" | null
    /** Set by `select(columns, { head: true })`: no rows come back. */
    head: boolean
    filters: RecordedFilter[]
    /** Each `order()` in turn: later ones break the earlier ones' ties. */
    order: { column: string; ascending: boolean }[]
    /** Set by `limit(count)`. */
    limit: number | null
    /** Set by `range(from, to)` (both inclusive, as PostgREST's). */
    range: { from: number; to: number } | null
    /** Set by `single()` / `maybeSingle()`. */
    returns: "rows" | "single" | "maybeSingle"
}

export interface FakeDataClient {
    client: DataClient
    /** The fake's Supabase auth (`services.auth`). */
    auth: FakeAuth
    /** The fake's Edge Functions (`services.functions`). */
    functions: FakeFunctions
    /** Google Places as the app sees it (`services.places`). */
    places: FakePlaces
    /** Supabase Storage (`services.files`). */
    files: FakeFiles
    /** The photo cropper and canvas (`services.images`). */
    images: FakeImages
    /** The database's functions (`rpc`): calls, handlers, failures. */
    rpc: FakeRpc
    requests: RecordedRequest[]
    /** The rows of `table`, live: seed more, or check what was written. */
    rows(table: string): Row[]
    /**
     * Runs just before each request is answered, e.g. to change the data
     * under it (another tab writing first).
     */
    beforeExecute(callback: (request: RecordedRequest) => void): void
    /**
     * Make every following request to `table` fail with `message`: the
     * server's error (HTTP 500, a code), or with `network` no answer at
     * all, as postgrest-js reports a failed fetch (status 0, no code: the
     * request may or may not have reached the database).
     */
    failTable(
        table: string,
        message: string,
        options?: { network?: boolean },
    ): void
    /** Let requests to `table` succeed again. */
    healTable(table: string): void
    /**
     * The next request `match` accepts is answered with the data as it is
     * when sent, but the answer arrives only when the returned function is
     * called: a response computed before a write that lands after it.
     */
    answerLate(match: (request: RecordedRequest) => boolean): () => void
    /** Hold every following request to `table` until `releaseTable`. */
    holdTable(table: string): void
    /**
     * Hold every following read (`select`) of `table` until
     * `releaseTable`, letting writes through: what a page shows after a
     * write then comes from the write's answer, in the cache.
     */
    holdReads(table: string): void
    /** Answer the held requests to `table`, and stop holding new ones. */
    releaseTable(table: string): void
}

function matches(row: Row, filter: RecordedFilter): boolean {
    if (filter.op === "or") return matchesTree(row, String(filter.value), "or")
    const value = row[filter.column]
    if (filter.op === "eq") return value === filter.value
    if (filter.op === "in") {
        return (filter.value as unknown[]).includes(value)
    }
    if (filter.op === "ilike") {
        return (
            value != null &&
            likePattern(String(filter.value)).test(String(value))
        )
    }
    const is = (value ?? null) === filter.value
    if (filter.op === "is") return is
    if (filter.op === "not.is") return !is
    // SQL comparisons with NULL are never true.
    if (value == null) return false
    if (filter.op === "neq") return value !== filter.value
    const [a, b] = [String(value), String(filter.value)]
    if (filter.op === "lt") return a < b
    if (filter.op === "lte") return a <= b
    if (filter.op === "gt") return a > b
    return a >= b
}

/**
 * A case-insensitive `ilike` pattern: `*` and `%` match any text, `_` one
 * character, and a backslash escapes the next one (Postgres' LIKE
 * escape).
 */
function likePattern(pattern: string): RegExp {
    const literal = (char: string) =>
        char.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&")
    let source = ""
    for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i]
        if (char === "\\" && i + 1 < pattern.length) {
            source += literal(pattern[++i])
        } else if (char === "*" || char === "%") source += "[\\s\\S]*"
        else if (char === "_") source += "[\\s\\S]"
        else source += literal(char)
    }
    return new RegExp(`^${source}$`, "i")
}

/**
 * Splits `a,b(c,d),e` at its top-level commas; a double-quoted value
 * (`"x,y"`, a backslash escaping the next character) is one piece of
 * text.
 */
function splitTopLevel(text: string): string[] {
    const parts: string[] = []
    let depth = 0
    let quoted = false
    let current = ""
    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        if (quoted) {
            current += char
            if (char === "\\") current += text[++i]
            else if (char === '"') quoted = false
            continue
        }
        if (char === '"') quoted = true
        if (char === "(") depth++
        if (char === ")") depth--
        if (char === "," && depth === 0) {
            parts.push(current)
            current = ""
        } else current += char
    }
    parts.push(current)
    return parts
}

/** A logic tree's value: a double-quoted one unquoted and unescaped. */
function treeValue(text: string): string {
    if (!text.startsWith('"')) return text
    return text.slice(1, -1).replace(/\\(.)/g, "$1")
}

/**
 * PostgREST's logic tree (`or=(…)`): conditions `column.op.value` (eq,
 * neq, lt, lte, gt, gte, ilike, and `is` null/true/false; values compared
 * as text, as above, and
 * double-quoted when they hold `,.:()`) and nested
 * `and(…)` / `or(…)`.
 */
function matchesTree(row: Row, tree: string, logic: "and" | "or"): boolean {
    const results = splitTopLevel(tree).map((term) => {
        const nested = /^(and|or)\((.*)\)$/.exec(term)
        if (nested) {
            return matchesTree(row, nested[2], nested[1] as "and" | "or")
        }
        const [column, op, ...rest] = term.split(".")
        if (
            !["eq", "neq", "lt", "lte", "gt", "gte", "ilike", "is"].includes(op)
        ) {
            throw new Error(`fake: no ${op} in or()`)
        }
        // PostgREST compares a logic tree's values as text.
        const value = treeValue(rest.join("."))
        if (op === "is") {
            const is = { null: null, true: true, false: false }[value]
            if (is === undefined) throw new Error(`fake: no is.${value}`)
            return (row[column] ?? null) === is
        }
        if (op === "eq") return String(row[column]) === value
        if (op === "neq")
            return row[column] != null && String(row[column]) !== value
        return matches(row, {
            op: op as RecordedFilter["op"],
            column,
            value,
        })
    })
    return logic === "and" ? results.every(Boolean) : results.some(Boolean)
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
    const auth = createFakeAuth()
    const functions = createFakeFunctions(() => auth.accessToken())
    const places = createFakePlaces()
    const files = createFakeFiles(() => auth.accessToken())
    const images = createFakeImages()
    const rpc = createFakeRpc(
        () => auth.accessToken(),
        (table) => (seed[table] ??= []),
    )
    const requests: RecordedRequest[] = []
    const failures = new Map<string, { message: string; network: boolean }>()
    const held = new Map<string, (() => void)[]>()
    const heldReads = new Map<string, (() => void)[]>()
    const lateAnswers: {
        match: (request: RecordedRequest) => boolean
        delivered: Promise<void>
    }[] = []
    let beforeExecute: ((request: RecordedRequest) => void) | undefined

    function from(table: string) {
        const request: RecordedRequest = {
            table,
            method: "select",
            token: null,
            select: "*",
            count: null,
            head: false,
            filters: [],
            order: [],
            limit: null,
            range: null,
            returns: "rows",
        }
        requests.push(request)

        const builder = {
            select(
                columns = "*",
                options: {
                    count?: RecordedRequest["count"]
                    head?: boolean
                } = {},
            ) {
                request.select = columns.replace(/\s+/g, "")
                request.count = options.count ?? null
                request.head = options.head ?? false
                return builder
            },
            insert(row: Row | Row[]) {
                request.method = "insert"
                if (Array.isArray(row)) request.rows = row
                else request.body = row
                return builder
            },
            update(values: Row) {
                request.method = "update"
                request.body = values
                return builder
            },
            delete() {
                request.method = "delete"
                return builder
            },
            eq: (column: string, value: unknown) =>
                addFilter("eq", column, value),
            neq: (column: string, value: unknown) =>
                addFilter("neq", column, value),
            lt: (column: string, value: unknown) =>
                addFilter("lt", column, value),
            lte: (column: string, value: unknown) =>
                addFilter("lte", column, value),
            gt: (column: string, value: unknown) =>
                addFilter("gt", column, value),
            gte: (column: string, value: unknown) =>
                addFilter("gte", column, value),
            ilike: (column: string, pattern: string) =>
                addFilter("ilike", column, pattern),
            in: (column: string, values: unknown[]) =>
                addFilter("in", column, [...values]),
            or: (tree: string) => addFilter("or", "", tree),
            is: (column: string, value: unknown) =>
                addFilter("is", column, value),
            not(column: string, operator: string, value: unknown) {
                if (operator !== "is") {
                    throw new Error(`fake: no not.${operator} filter`)
                }
                return addFilter("not.is", column, value)
            },
            order(column: string, options: { ascending?: boolean } = {}) {
                request.order.push({
                    column,
                    ascending: options.ascending ?? true,
                })
                return builder
            },
            limit(count: number) {
                request.limit = count
                return builder
            },
            range(from: number, to: number) {
                request.range = { from, to }
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
                    error: { message: string; code?: string } | null
                    /** The HTTP status; 0 when no answer came (network). */
                    status?: number
                    /** The rows matched, when the select asked to count. */
                    count?: number | null
                }) => T,
                reject?: (reason: unknown) => T,
            ) {
                // The token goes out with the request, as the real client's
                // fetch reads it.
                request.token = auth.accessToken()
                const late = lateAnswers.findIndex(({ match }) =>
                    match(request),
                )
                if (late !== -1) {
                    // Answered as of now, delivered when released.
                    const [{ delivered }] = lateAnswers.splice(late, 1)
                    const result = execute(request)
                    return delivered.then(() => result).then(resolve, reject)
                }
                const waiting =
                    held.get(table) ??
                    (request.method === "select"
                        ? heldReads.get(table)
                        : undefined)
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
        if (failure?.network) {
            return {
                data: null,
                error: { message: `TypeError: ${failure.message}`, code: "" },
                status: 0,
            }
        }
        if (failure) {
            return {
                data: null,
                error: { message: failure.message, code: "XX000" },
                status: 500,
            }
        }

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

        beforeExecute?.(request)
        const table = (seed[request.table] ??= [])
        let inserted: Row[] | undefined
        if (request.method === "insert") {
            const body = request.rows ?? (request.body ? [request.body] : [])
            // Every table the app inserts into has a unique `id` (sent by
            // the client, or the column's default).
            const unique = ["id", ...(UNIQUE_COLUMNS[request.table] ?? [])]
            if (
                body.some((row) =>
                    unique.some(
                        (column) =>
                            row[column] != null &&
                            table.some(
                                (other) => other[column] === row[column],
                            ),
                    ),
                )
            ) {
                return {
                    data: null,
                    error: {
                        message:
                            "duplicate key value violates unique constraint",
                        code: "23505",
                    },
                    status: 409,
                }
            }
            for (const key of FOREIGN_KEYS[request.table] ?? []) {
                const missing = body.find(
                    (row) =>
                        row[key.column] != null &&
                        !(seed[key.references] ?? []).some(
                            (other) => other.id === row[key.column],
                        ),
                )
                if (missing) {
                    return {
                        data: null,
                        error: {
                            message: `insert or update on table "${request.table}" violates foreign key constraint "${key.constraint}"`,
                            details: `Key (${key.column})=(${String(missing[key.column])}) is not present in table "${key.references}".`,
                            code: "23503",
                        },
                        status: 409,
                    }
                }
            }
            inserted = body.map((sent) => {
                const row: Row = { id: crypto.randomUUID(), ...sent }
                const serial = SERIAL_COLUMNS[request.table]
                if (serial && row[serial] == null) {
                    row[serial] =
                        Math.max(
                            0,
                            ...table.map((other) => Number(other[serial])),
                        ) + 1
                }
                table.push(row)
                return row
            })
        }
        // An update returns the rows its filters matched before it changed
        // them (`UPDATE … WHERE … RETURNING`).
        let updated: Row[] | undefined
        if (request.method === "update") {
            updated = where(request.table, "")
            for (const row of updated) Object.assign(row, request.body)
        }
        // A delete returns the rows it removed (`DELETE … RETURNING`).
        let deleted: Row[] | undefined
        if (request.method === "delete") {
            deleted = where(request.table, "")
            for (const key of REFERENCED_BY[request.table] ?? []) {
                const referenced = deleted.find((row) =>
                    (seed[key.table] ?? []).some(
                        (other) => other[key.column] === row.id,
                    ),
                )
                if (referenced) {
                    return {
                        data: null,
                        error: {
                            message: `update or delete on table "${request.table}" violates foreign key constraint "${key.constraint}" on table "${key.table}"`,
                            details: `Key (id)=(${String(referenced.id)}) is still referenced from table "${key.table}".`,
                            code: "23503",
                        },
                        status: 409,
                    }
                }
            }
            for (const row of deleted) table.splice(table.indexOf(row), 1)
        }

        let rows =
            request.method === "insert"
                ? (inserted ?? [])
                : (updated ?? deleted ?? where(request.table, ""))
        if (request.order.length > 0) {
            rows = [...rows].sort((a, b) => {
                for (const { column, ascending } of request.order) {
                    const result = String(a[column]).localeCompare(
                        String(b[column]),
                    )
                    if (result !== 0) return ascending ? result : -result
                }
                return 0
            })
        }
        const count = request.count ? rows.length : null
        if (request.range) {
            rows = rows.slice(request.range.from, request.range.to + 1)
        }
        if (request.limit !== null) rows = rows.slice(0, request.limit)
        const fields = parseSelect(request.select)
        const data = rows.map((row) => project(request.table, row, fields, ""))
        // As PostgREST answers (postgrest-js passes the status on).
        const status = request.method === "insert" ? 201 : 200
        if (request.head) return { data: null, error: null, status, count }
        if (request.returns === "rows") {
            return { data, error: null, status, count }
        }
        if (data.length > 1 || (request.returns === "single" && !data[0])) {
            return {
                data: null,
                error: {
                    message:
                        "JSON object requested, multiple (or no) rows returned",
                    code: "PGRST116",
                },
                status: 406,
            }
        }
        return { data: data[0] ?? null, error: null, status }
    }

    return {
        client: {
            from,
            rpc: (name: string, args: Row = {}) => rpc.call(name, args),
        } as unknown as DataClient,
        auth,
        functions,
        places,
        files,
        images,
        rpc,
        requests,
        rows: (table) => (seed[table] ??= []),
        beforeExecute: (callback) => {
            beforeExecute = callback
        },
        failTable: (table, message, { network = false } = {}) => {
            failures.set(table, { message, network })
        },
        healTable: (table) => {
            failures.delete(table)
        },
        answerLate: (match) => {
            let deliver!: () => void
            const delivered = new Promise<void>((resolve) => {
                deliver = resolve
            })
            lateAnswers.push({ match, delivered })
            return deliver
        },
        holdTable: (table) => {
            held.set(table, held.get(table) ?? [])
        },
        holdReads: (table) => {
            heldReads.set(table, heldReads.get(table) ?? [])
        },
        releaseTable: (table) => {
            const waiting = [
                ...(held.get(table) ?? []),
                ...(heldReads.get(table) ?? []),
            ]
            held.delete(table)
            heldReads.delete(table)
            for (const answer of waiting) answer()
        },
    }
}
