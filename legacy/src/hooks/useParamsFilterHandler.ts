import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { utilService } from "../util/utilService"

interface IUseParamsFilterHandler {
    currentValues: string[]
    onOptionsChange: (type: string) => (values: string[]) => void
    clearSearchParams: (titles: string[]) => void
    selectOption: (value: string) => void
    removeOption: (value: string) => void
}

export const useParamsFilterHandler = (): IUseParamsFilterHandler => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [currentValues, setCurrentValues] = useState<string[]>([])

    const getInitialValues = useCallback(() => {
        const filters = searchParams.getAll("f")
        return filters
    }, [searchParams])

    const onOptionsChange = (type: string) => (values: string[]) => {
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.delete(type)
        values.forEach((value) => newSearchParams.append(type, value))
        setSearchParams(newSearchParams, { replace: true })
        localStorage.setItem(type, JSON.stringify(values))
    }

    const selectOption = (value: string) => {
        const type = utilService.getFilterItemType(value)
        const newSearchParams = new URLSearchParams(searchParams)
        const existingValues = newSearchParams.getAll(type)

        // Check if the value already exists to avoid duplicates
        if (!existingValues.includes(value)) {
            newSearchParams.append("f", value)
        }

        setSearchParams(newSearchParams, { replace: true })
        const storedValues = JSON.parse(localStorage.getItem(type) || "[]")

        localStorage.setItem(type, JSON.stringify([...storedValues, value]))
    }

    const removeOption = (value: string) => {
        const newSearchParams = new URLSearchParams(searchParams)
        const values = newSearchParams.getAll("f").filter((v) => v !== value)
        newSearchParams.delete("f")
        values.forEach((v) => newSearchParams.append("f", v))
        setSearchParams(newSearchParams, { replace: true })
        const type = utilService.getFilterItemType(value)
        const storedValues = JSON.parse(localStorage.getItem(type) || "[]")
        const newValues = storedValues.filter((v: string) => v !== value)
        localStorage.setItem(type, JSON.stringify(newValues))
    }
    // Clearing based on instance search params rewrites other instances' search params
    // so i pass all of the titles to clear
    const clearSearchParams = (titles: string[]) => {
        const newSearchParams = new URLSearchParams(searchParams)
        titles.forEach((t) => newSearchParams.delete(t))
        setSearchParams(newSearchParams, { replace: true })
    }
    useEffect(() => {
        const initialValues = getInitialValues()
        setCurrentValues(initialValues)
    }, [searchParams, getInitialValues])

    return {
        currentValues,
        onOptionsChange,
        clearSearchParams,
        removeOption,
        selectOption,
    }
}
