import { Language } from "./interfaces"
import dayjs from "dayjs"
import "dayjs/locale/en"
import "dayjs/locale/ru"
import "dayjs/locale/he"
import { utilService } from "./utilService"
// Add cache interface and cache map at the top of the file
interface TranslationCache {
    [key: string]: {
        [targetLang: string]: string
    }
}

const memoryCache: TranslationCache = {}

// Add a type for translation context
type TranslationContext = "name" | "general" | "month"

export const translatePage = async (lang: Language) => {
    const elementsToTranslate = document.querySelectorAll(".translate-this")

    for (const element of elementsToTranslate) {
        // Get translation context from data attribute
        const context =
            (element.getAttribute(
                "data-translation-context"
            ) as TranslationContext) || "general"

        if (!element.getAttribute("data-original-text")) {
            element.setAttribute(
                "data-original-text",
                element.textContent || ""
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
                        context
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
    context: TranslationContext = "general" // Default context
): Promise<string> => {
    // Check memory cache first
    if (memoryCache[text]?.[targetLang]) {
        return memoryCache[text][targetLang]
    }

    // Check localStorage cache
    try {
        const localStorageKey = `translation_${text}_${targetLang}`
        const localStorageTranslation = localStorage.getItem(localStorageKey)
        if (localStorageTranslation) {
            // Store in memory cache too
            if (!memoryCache[text]) memoryCache[text] = {}
            memoryCache[text][targetLang] = localStorageTranslation
            return localStorageTranslation
        }
    } catch (error) {
        console.warn("localStorage access error:", error)
    }

    // Check browser cache
    const cacheKey = `translation_${text}_${targetLang}`
    try {
        const cache = await caches.open("translations-cache")
        const cachedResponse = await cache.match(cacheKey)
        if (cachedResponse) {
            const cachedTranslation = await cachedResponse.text()

            // Store in memory cache too
            if (!memoryCache[text]) memoryCache[text] = {}
            memoryCache[text][targetLang] = cachedTranslation

            return cachedTranslation
        }
    } catch (error) {
        console.warn("Cache access error:", error)
    }

    // Proceed with API translation if not cached
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

    if (!API_KEY) {
        console.error("No API key found")
        return text
    }

    try {
        const response = await fetch(
            `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    q: text,
                    target: targetLang,
                    source: "he",
                    format: "text", // Preserve formatting
                    model: "nmt", // Use Neural Machine Translation
                    context: text, // Provide surrounding text as context
                    glossary: context === "name" ? "preserve-names" : undefined, // Special handling for names
                }),
            }
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const translatedText = data.data.translations[0].translatedText

        // Cache the successful translation
        try {
            // Store in memory cache
            if (!memoryCache[text]) memoryCache[text] = {}
            memoryCache[text][targetLang] = translatedText

            // Store in localStorage
            const localStorageKey = `translation_${text}_${targetLang}`
            localStorage.setItem(localStorageKey, translatedText)

            // Store in browser cache
            const cache = await caches.open("translations-cache")
            await cache.put(cacheKey, new Response(translatedText))
        } catch (error) {
            console.warn("Cache storage error:", error)
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
        day
    )}`
}
