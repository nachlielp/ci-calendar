import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { SelectOption } from "../util/options"

interface IUseParamsHandlerProps {
    title: string
    options: SelectOption[]
}

interface IUseParamsHandler {
    currentValues: string[]
    onOptionsChange: (type: string) => (values: string[]) => void
    clearSearchParams: (titles: string[]) => void
    selectOption: (type: string, value: string) => void
    removeOption: (type: string, value: string) => void
}

export const useParamsHandler = ({
    title,
    options,
}: IUseParamsHandlerProps): IUseParamsHandler => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [currentValues, setCurrentValues] = useState<string[]>([])

    const getInitialValues = useCallback(
        (paramName: string, options: SelectOption[]) => {
            const params = searchParams.getAll(paramName)
            return options
                .filter((option) => params.includes(option.value))
                .map((option) => option.value)
        },
        [searchParams]
    )
    const onOptionsChange = (type: string) => (values: string[]) => {
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.delete(type)
        values.forEach((value) => newSearchParams.append(type, value))
        setSearchParams(newSearchParams, { replace: true })
    }

    const selectOption = (type: string, value: string) => {
        const newSearchParams = new URLSearchParams(searchParams)
        const existingValues = newSearchParams.getAll(type)

        // Check if the value already exists to avoid duplicates
        if (!existingValues.includes(value)) {
            newSearchParams.append(type, value)
        }

        setSearchParams(newSearchParams, { replace: true })
    }

    const removeOption = (type: string, value: string) => {
        console.log("removeOption", type, value)
        const newSearchParams = new URLSearchParams(searchParams)
        const values = newSearchParams.getAll(type).filter((v) => v !== value)
        newSearchParams.delete(type)
        values.forEach((v) => newSearchParams.append(type, v))
        setSearchParams(newSearchParams, { replace: true })
    }
    // Clearing based on instance search params rewrites other instances' search params
    // so i pass all of the titles to clear
    const clearSearchParams = (titles: string[]) => {
        const newSearchParams = new URLSearchParams(searchParams)
        titles.forEach((t) => newSearchParams.delete(t))
        setSearchParams(newSearchParams, { replace: true })
    }
    useEffect(() => {
        const initialValues = getInitialValues(`${title}`, options)
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
