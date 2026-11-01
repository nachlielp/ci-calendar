// The web-platform globals the core may use: ones the browser, Cloudflare
// Workers, React Native (with Expo's standard URL) and Node all have. The
// core has no DOM and no Node types (tsconfig.json), so anything else is a
// type error. Each declaration is a subset of the real one: code that
// typechecks against these typechecks in every app too (each app compiles
// the core with its own platform's types). Add a member only when the core
// needs it and every platform has it. Tests use Node's declarations instead
// (tsconfig.test.json leaves this file out).

/** An opaque timer handle: a number in browsers, an object in Node. */
type TimerHandle = { readonly __timer: unique symbol }

declare function setTimeout(handler: () => void, ms?: number): TimerHandle
declare function clearTimeout(handle: TimerHandle | undefined): void

/** WHATWG URL: only the members the core reads. */
declare class URL {
    constructor(url: string, base?: string | URL)
    readonly href: string
    readonly protocol: string
    readonly hostname: string
    readonly host: string
    readonly pathname: string
    readonly search: string
    readonly hash: string
    toString(): string
}

declare class URLSearchParams {
    constructor(init?: string | Record<string, string> | [string, string][])
    get(name: string): string | null
    getAll(name: string): string[]
    has(name: string): boolean
    set(name: string, value: string): void
    append(name: string, value: string): void
    delete(name: string): void
    toString(): string
}

/** Bytes with a content type: a picked photo on the web. */
interface Blob {
    readonly size: number
    readonly type: string
}

type HeadersInit = Headers | Record<string, string> | [string, string][]

declare class Headers {
    constructor(init?: HeadersInit)
    get(name: string): string | null
    has(name: string): boolean
    set(name: string, value: string): void
    append(name: string, value: string): void
    delete(name: string): void
}

interface AbortSignal {
    readonly aborted: boolean
}

declare class AbortController {
    readonly signal: AbortSignal
    abort(reason?: unknown): void
}

interface RequestInit {
    method?: string
    headers?: HeadersInit
    body?: string | Blob | ArrayBuffer | null
    signal?: AbortSignal | null
    credentials?: "omit" | "same-origin" | "include"
}

interface Response {
    readonly ok: boolean
    readonly status: number
    readonly statusText: string
    readonly headers: Headers
    json(): Promise<unknown>
    text(): Promise<string>
}

declare function fetch(
    input: string | URL,
    init?: RequestInit,
): Promise<Response>
