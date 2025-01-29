import { createContext } from "react"
import { Language } from "../util/interfaces"
import { store } from "../Store/store"
import { observer } from "mobx-react-lite"

export const LanguageContext = createContext({
    language: Language.en,
    setLanguage: (language: Language) => {
        store.setLanguage(language)
    },
})

export const LanguageProvider = observer(
    ({ children }: { children: React.ReactNode }) => {
        const updateLanguage = (newLanguage: Language) => {
            store.setLanguage(newLanguage)
        }

        return (
            <LanguageContext.Provider
                value={{
                    language: store.getLanguage,
                    setLanguage: updateLanguage,
                }}
            >
                {children}
            </LanguageContext.Provider>
        )
    }
)
