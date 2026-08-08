import { Language } from "./interfaces"
import dayjs from "dayjs"
import "dayjs/locale/en"
import "dayjs/locale/ru"
import "dayjs/locale/he"
import { utilService } from "./utilService"
import { supabase } from "../supabase/client"

interface TranslationCache {
    [key: string]: {
        [targetLang: string]: string
    }
}

const memoryCache: TranslationCache = {}

const rememberInMemory = (text: string, lang: Language, value: string) => {
    if (!memoryCache[text]) memoryCache[text] = {}
    memoryCache[text][lang] = value
}

// Add a type for translation context
type TranslationContext = "name" | "general" | "month"

export const translatePage = async (lang: Language) => {
    const elementsToTranslate = document.querySelectorAll(".translate-this")

    for (const element of elementsToTranslate) {
        // Get translation context from data attribute
        const context =
            (element.getAttribute(
                "data-translation-context",
            ) as TranslationContext) || "general"

        if (!element.getAttribute("data-original-text")) {
            element.setAttribute(
                "data-original-text",
                element.textContent || "",
            )
        }

        const originalText = element.getAttribute("data-original-text")
        if (originalText) {
            if (lang === Language.he) {
                element.textContent = originalText
            } else {
                try {
                    const translatedText = await translateText(
                        originalText,
                        lang,
                        context,
                    )
                    element.textContent = translatedText
                } catch (error) {
                    console.error("Translation error:", error)
                }
            }
        }
    }
}

export const translateText = async (
    text: string,
    targetLang: Language,
    context: TranslationContext = "general",
): Promise<string> => {
    // 1. In-memory cache (this session).
    if (memoryCache[text]?.[targetLang]) {
        return memoryCache[text][targetLang]
    }

    // 2. Persistent browser Cache API. Replaces the previous unbounded
    //    one-localStorage-entry-per-string cache (which risked quota errors);
    //    the Cache API is not bound by the small localStorage quota. Reads and
    //    writes are wrapped so a cache failure never surfaces into user flows.
    const cacheKey = `translation_${text}_${targetLang}`
    if (typeof caches !== "undefined") {
        try {
            const cache = await caches.open("translations-cache")
            const cachedResponse = await cache.match(cacheKey)
            if (cachedResponse) {
                const cachedTranslation = await cachedResponse.text()
                rememberInMemory(text, targetLang, cachedTranslation)
                return cachedTranslation
            }
        } catch (error) {
            console.warn("Cache access error:", error)
        }
    }

    // 3. Translate via the Supabase Edge Function. The billable Google key
    //    lives only server-side there — the client holds no key that can reach
    //    the Translate REST API. See supabase/functions/translate.
    try {
        const { data, error } = await supabase.functions.invoke("translate", {
            body: { text, targetLang, source: "he", context },
        })
        if (error) throw error

        const translatedText: string | undefined = data?.translatedText
        if (!translatedText) {
            return text
        }

        rememberInMemory(text, targetLang, translatedText)
        if (typeof caches !== "undefined") {
            try {
                const cache = await caches.open("translations-cache")
                await cache.put(cacheKey, new Response(translatedText))
            } catch (error) {
                console.warn("Cache storage error:", error)
            }
        }

        return translatedText
    } catch (error) {
        console.error("Translation failed:", error)
        return text
    }
}

export const getMonthName = (date: dayjs.Dayjs, lang: Language): string => {
    if (lang === Language.he) {
        return utilService.formatHebrewDate(date.toISOString())
    }
    // Set locale based on target language
    const locale = lang === Language.ru ? "ru" : "en"

    // Get the day number
    const day = date.date()

    // Get ordinal suffix for the day (st, nd, rd, th)
    const getOrdinalSuffix = (day: number): string => {
        if (day > 3 && day < 21) return "th"
        switch (day % 10) {
            case 1:
                return "st"
            case 2:
                return "nd"
            case 3:
                return "rd"
            default:
                return "th"
        }
    }

    // Format as "Month Day[ordinal]" (e.g., "January 1st")
    return `${date.locale(locale).format("MMMM")} ${day}${getOrdinalSuffix(
        day,
    )}`
}
