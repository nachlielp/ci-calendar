import DoubleBindedSelect from "./DoubleBindedSelectProps"
import { districtOptions, eventOptions } from "../../../util/options"
import { useEffect, useState } from "react"
import debounce from "lodash/debounce"
import { usersService } from "../../../supabase/usersService"
import { useUser } from "../../../context/UserContext"

export default function DefaultFilterSettings() {
    const { user } = useUser()

    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }
    const [districts, setDistricts] = useState<string[]>(
        user?.default_filter?.districts.map((event) => event.valueOf()) || []
    )
    const [ciEventTypes, setCiEventTypes] = useState<string[]>(
        user.default_filter?.eventTypes.map((event) => event.valueOf()) || []
    )

    useEffect(() => {
        debouncedSaveFilters()
        saveFiltersToLocalStorage()
    }, [districts, ciEventTypes])

    function debouncedSaveFilters() {
        const saveFilters = debounce(async () => {
            if (!user) {
                throw new Error(
                    "user is null, make sure you're within a Provider"
                )
            }
            try {
                await usersService.updateUser(user.user_id, {
                    default_filter: {
                        districts,
                        eventTypes: ciEventTypes,
                    },
                })
            } catch (error) {
                console.error(
                    "FiltersAndNotificationsPage.debouncedSaveFilters.error: ",
                    error
                )
            }
        }, 1000)

        saveFilters()
    }

    function saveFiltersToLocalStorage() {
        const filters = {
            districts,
            eventTypes: ciEventTypes,
        }
        localStorage.setItem("defaultFilters", JSON.stringify(filters))
    }

    return (
        <>
            <DoubleBindedSelect
                options={districtOptions}
                selectedValues={districts}
                onChange={(values: string[]) => {
                    const selectedDistricts = values
                    setDistricts(selectedDistricts)
                }}
                placeholder="בחירת אזור"
                className="select-filter"
            />
            <DoubleBindedSelect
                options={eventOptions.filter(
                    (event) => event.value !== "warmup"
                )}
                selectedValues={ciEventTypes}
                onChange={(values: string[]) => {
                    setCiEventTypes(values)
                }}
                placeholder="בחירת ארועים"
                className="select-filter"
            />
        </>
    )
}
