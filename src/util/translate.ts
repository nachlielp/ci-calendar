import { store } from "../Store/store"
import { Language } from "./interfaces"

// Add cache interface and cache map at the top of the file
interface TranslationCache {
    [key: string]: {
        [targetLang: string]: string
    }
}

const memoryCache: TranslationCache = {}

export const switchLanguage = async (lang: Language) => {
    store.setLanguage(lang)

    const elementsToTranslate = document.querySelectorAll(".translate-this")

    for (const element of elementsToTranslate) {
        // Store original text if not already stored
        if (!element.getAttribute("data-original-text")) {
            element.setAttribute(
                "data-original-text",
                element.textContent || ""
            )
        }

        const originalText = element.getAttribute("data-original-text")
        if (originalText) {
            if (lang === Language.he) {
                // If Hebrew is selected, revert to original text
                element.textContent = originalText
            } else {
                // Always translate if target language is not Hebrew
                try {
                    console.log(`Translating: ${originalText} to ${lang}`)
                    const translatedText = await translateText(
                        originalText,
                        lang
                    )
                    element.textContent = translatedText
                } catch (error) {
                    console.error("Translation error:", error)
                }
            }
        }
    }
}

const translateText = async (
    text: string,
    targetLang: Language
): Promise<string> => {
    // Check memory cache first
    if (memoryCache[text]?.[targetLang]) {
        console.log("Translation found in memory cache")
        return memoryCache[text][targetLang]
    }

    // Check localStorage cache
    try {
        const localStorageKey = `translation_${text}_${targetLang}`
        const localStorageTranslation = localStorage.getItem(localStorageKey)
        if (localStorageTranslation) {
            console.log("Translation found in localStorage")
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
            console.log("Translation found in browser cache")

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
