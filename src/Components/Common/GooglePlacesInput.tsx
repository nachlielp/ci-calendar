import { useState, useEffect } from "react"
import GooglePlacesAutocomplete from "react-google-places-autocomplete"
import { IAddress } from "../../util/interfaces"

interface IGooglePlacesInputProps {
    onPlaceSelect: (e: IGooglePlaceOption) => void
    defaultValue?: IAddress
}

const GooglePlacesInput = ({
    defaultValue,
    onPlaceSelect,
}: IGooglePlacesInputProps) => {
    const [selectedOption, setSelectedOption] = useState<any>(null)
    useEffect(() => {
        if (defaultValue) {
            const defaultOption = {
                label: defaultValue.label,
                value: {
                    place_id: defaultValue.place_id,
                    description: defaultValue.label,
                    matched_substrings: [],
                    reference: defaultValue.place_id,
                    structured_formatting: {
                        main_text: defaultValue.label,
                        main_text_matched_substrings: [],
                        secondary_text: "",
                    },
                    terms: [],
                    types: [],
                },
            }
            setSelectedOption(defaultOption)
        }
    }, [defaultValue])

    const handleChange = (option: any) => {
        setSelectedOption(option)
        onPlaceSelect(option)
    }

    return (
        <div>
            <GooglePlacesAutocomplete
                selectProps={{
                    value: selectedOption,
                    onChange: handleChange,
                    placeholder: "חפש כתובת",
                }}
                apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                apiOptions={{ language: "he", region: "IL" }}
            />
        </div>
    )
}

export default GooglePlacesInput

export interface IGooglePlaceOption {
    label: string
    value: {
        place_id: string
        description: string
        matched_substrings: Array<{
            length: number
            offset: number
        }>
        reference: string
        structured_formatting: {
            main_text: string
            main_text_matched_substrings: Array<{
                length: number
                offset: number
            }>
            secondary_text: string
        }
        terms: Array<{
            offset: number
            value: string
        }>
        types: string[]
    }
}

export async function getAddressFromGooglePlaceId(
    placeId: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        const service = new google.maps.places.PlacesService(
            document.createElement("div")
        )

        const request = {
            placeId: placeId,
            fields: ["formatted_address"],
            language: "en", // Request English address
        }

        service.getDetails(request, (result, status) => {
            if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                result
            ) {
                resolve(result.formatted_address ?? "")
            } else {
                console.error("Error fetching English address:", status)
                reject(new Error(`Failed to fetch address: ${status}`))
            }
        })
    })
}
