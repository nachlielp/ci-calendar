import { useEffect } from "react"
import { store } from "../Store/store"

export const useClearUser = () => {
    useEffect(() => {
        store.clearUser()
    }, [])
}
