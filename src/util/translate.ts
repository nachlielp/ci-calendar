import { Language } from "./interfaces"

export const switchLanguage = async (lang: Language) => {
    console.log("switchLanguage", lang)
    const elementsToTranslate = document.querySelectorAll(".translate-this")
    console.log("elementsToTranslate", elementsToTranslate)

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
    console.log("translateText", text, targetLang)
    // For testing, log the translation request
    console.log(`Translation requested: ${text} to ${targetLang}`)

    // Replace this with your actual translation API call
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
                    source: "he", // assuming English is the source language
                }),
            }
        )

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Translation response:", data) // For debugging
        return data.data.translations[0].translatedText
    } catch (error) {
        console.error("Translation failed:", error)
        return text // Return original text if translation fails
    }
}
