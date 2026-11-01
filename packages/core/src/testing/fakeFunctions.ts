import type { Functions } from "@ci-calendar/core/data/functions"

// The fake's Edge Functions (`createFakeDataClient().functions`): every
// call is recorded with the token it carried; a function answers through
// the handler a test gives it (`handle`), and without one it fails, as an
// undeployed function would. Calls can be made to fail or held until the
// test releases them (a slow function).

export interface FunctionCall {
    name: string
    body: Record<string, unknown>
    /** The access token the call carried (`null`: the anon key). */
    token: string | null
}

type Handler = (body: Record<string, unknown>) => unknown

export interface FakeFunctions extends Functions {
    calls: FunctionCall[]
    /** `name` answers with what `handler` returns for the call's body. */
    handle(name: string, handler: Handler): void
    /** Every following call to `name` fails with `message`. */
    fail(name: string, message?: string): void
    /** Hold every following call to `name` until `release(name)`. */
    hold(name: string): void
    release(name: string): void
}

/**
 * The `translate` function as a test can predict it: `"<text> [<lang>]"`.
 * `fake.functions.handle("translate", fakeTranslation)`.
 */
export const fakeTranslation: Handler = ({ text, targetLang }) => ({
    translatedText: `${String(text)} [${String(targetLang)}]`,
})

export function createFakeFunctions(
    accessToken: () => string | null,
): FakeFunctions {
    const calls: FunctionCall[] = []
    const handlers = new Map<string, Handler>()
    const failures = new Map<string, string>()
    const held = new Map<string, (() => void)[]>()
    return {
        calls,
        handle: (name, handler) => {
            failures.delete(name)
            handlers.set(name, handler)
        },
        fail: (name, message = "Edge Function returned a non-2xx status") => {
            failures.set(name, message)
        },
        hold: (name) => {
            held.set(name, held.get(name) ?? [])
        },
        release: (name) => {
            const waiting = held.get(name) ?? []
            held.delete(name)
            for (const answer of waiting) answer()
        },
        async invoke<T>(
            name: string,
            { body }: { body: Record<string, unknown> },
        ) {
            calls.push({ name, body, token: accessToken() })
            const waiting = held.get(name)
            if (waiting) await new Promise<void>((go) => waiting.push(go))
            const failure = failures.get(name)
            const handler = handlers.get(name)
            if (failure || !handler) {
                return {
                    data: null,
                    error: { message: failure ?? `No function ${name}` },
                }
            }
            return { data: handler(body) as T, error: null }
        },
    }
}
