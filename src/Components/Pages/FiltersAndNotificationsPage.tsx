import Card from "antd/es/card"
import { districtOptions, eventOptions } from "../../util/options"
import { useEffect, useState } from "react"
import { useUser } from "../../context/UserContext"
import { usersService } from "../../supabase/usersService"
import DoubleBindedSelect from "../UI/Other/DoubleBindedSelectProps"
import debounce from "lodash/debounce"
import SubscribeToTeachers from "../UI/Other/SubscribeToTeachers"

export default function FiltersAndNotificationsPage() {
    const { user } = useUser()

    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }

    const [districts, setDistricts] = useState<string[]>(
        user.default_filter?.districts.map((event) => event.valueOf()) || []
    )
    const [ciEventTypes, setCiEventTypes] = useState<string[]>(
        user.default_filter?.eventTypes.map((event) => event.valueOf()) || []
    )

    useEffect(() => {
        debouncedSaveFilters()
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

    return (
        <div className="filter-and-notifications-page">
            <Card className="filter-section">
                <h3>הגדרת פילטר דיפולטיבי</h3>
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
                <h3>הרשמה למורים</h3>
                <SubscribeToTeachers />
            </Card>
        </div>
    )
}
