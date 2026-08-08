# `translate` Edge Function

Server-side proxy for Google Cloud Translation v2. It exists so the **billable
Google Translate key never ships to the browser** (ticket #14). The web client
calls it through `supabase.functions.invoke("translate", …)` in
[`src/util/translate.ts`](../../../src/util/translate.ts); the client no longer
holds any key that can reach the Translate REST API.

## Request / response

`POST` with a JSON body:

```json
{ "text": "שלום", "targetLang": "en", "source": "he" }
```

Returns `{ "translatedText": "hello" }` on success, or `{ "error": "…" }` with a
4xx/5xx status.

## One-time deploy (requires DB/console access — cannot be done from CI)

1. **Create a server-side Google key** in the Google Cloud console that is
   scoped to the **Cloud Translation API only** (no Places/Maps). Do **not**
   add HTTP-referrer restrictions — this key is used server-to-server.

2. **Set it as a function secret** (never commit it):

   ```bash
   supabase secrets set GOOGLE_TRANSLATE_API_KEY=xxxxxxxx
   ```

3. **Deploy the function:**

   ```bash
   supabase functions deploy translate
   ```

4. **Lock down the browser Places key** (the other half of #14): in the Google
   Cloud console, HTTP-referrer-restrict `VITE_GOOGLE_PLACES_API_KEY` to the
   production domain(s) and scope it to the Places/Maps JS APIs only. Ensure the
   old combined key is rotated/retired so it can no longer call Translate.

## Abuse hardening (follow-up)

`verify_jwt = false` (see `../../config.toml`) lets anonymous visitors
translate; the function is still gated by the project anon apikey, which is
public. That is strictly better than shipping the raw Google key (calls are now
funnelled through a function we control), but it does not stop a determined
caller from spending Translate quota. Recommended follow-ups: per-IP rate
limiting, restricting `targetLang` to the supported set, and a max `text`
length. The client already caches aggressively (memory + Cache API) to minimise
calls.
