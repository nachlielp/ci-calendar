// Supabase Edge Function: translate
//
// Proxies Google Cloud Translation v2 so the billable Google key lives ONLY
// here (server side) and never ships to the browser. The web client calls this
// via `supabase.functions.invoke("translate", { body })` — see
// src/util/translate.ts. Deploy + secret instructions in ./README.md.
//
// This runs on Deno (Supabase Edge runtime), not on this repo's Node/TS
// toolchain, which is why it's excluded from tsconfig `include` and ESLint.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GOOGLE_TRANSLATE_ENDPOINT =
    "https://translation.googleapis.com/language/translate/v2"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

interface TranslateRequest {
    text?: string
    targetLang?: string
    source?: string
}

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
}

Deno.serve(async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }
    if (req.method !== "POST") {
        return json({ error: "Method not allowed" }, 405)
    }

    const apiKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY")
    if (!apiKey) {
        return json({ error: "Translation is not configured" }, 500)
    }

    let payload: TranslateRequest
    try {
        payload = await req.json()
    } catch {
        return json({ error: "Invalid JSON body" }, 400)
    }

    const { text, targetLang, source = "he" } = payload
    if (!text || !targetLang) {
        return json({ error: "`text` and `targetLang` are required" }, 400)
    }

    try {
        const googleResponse = await fetch(
            `${GOOGLE_TRANSLATE_ENDPOINT}?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    q: text,
                    target: targetLang,
                    source,
                    format: "text",
                }),
            },
        )

        if (!googleResponse.ok) {
            return json(
                { error: `Translation upstream error ${googleResponse.status}` },
                502,
            )
        }

        const data = await googleResponse.json()
        const translatedText: string | undefined =
            data?.data?.translations?.[0]?.translatedText
        if (typeof translatedText !== "string") {
            return json({ error: "Unexpected translation response" }, 502)
        }

        return json({ translatedText })
    } catch (_error) {
        return json({ error: "Translation request failed" }, 502)
    }
})
