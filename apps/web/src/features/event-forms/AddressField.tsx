import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { pickedPlaceInEnglish } from "@ci-calendar/core/data/placeLookups"
import type {
    PlaceSuggestion,
    PlacesApi,
    PlacesSession,
} from "@ci-calendar/core/data/places"
import { EVENT_FORM_COPY } from "@ci-calendar/core/features/event-forms/eventFormCopy"
import type { AddressValue } from "@ci-calendar/core/features/event-forms/eventFormValues"

/** How long typing pauses before Google is asked (legacy's library: 300ms). */
const DEBOUNCE_MS = 300

/**
 * Legacy GooglePlacesInput: an address searched with Google Places, in
 * Hebrew. Google's script loads when the field is first focused (never
 * before), then each pause in typing asks for matching places; picking one
 * sets the address, and then its English label (`enLabel`, for English and
 * Russian readers) once Google gives it, in the same billing session as
 * the suggestions. Picking the address already set keeps it as it is.
 * Typing doesn't clear the picked address: leaving the field without
 * picking keeps it. An ARIA combobox over a listbox.
 */
export function AddressField({
    value,
    onChange,
    onBlur,
    error,
}: {
    value: AddressValue | null
    onChange: (address: AddressValue) => void
    onBlur?: () => void
    error?: string
}) {
    const copy = useCopy(EVENT_FORM_COPY)
    const { places } = useServices()
    const id = useId()
    const [editing, setEditing] = useState(false)
    const [query, setQuery] = useState("")
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
    const [searched, setSearched] = useState(false)
    const [unavailable, setUnavailable] = useState(false)
    const [active, setActive] = useState(0)
    const api = useRef<Promise<PlacesApi> | null>(null)
    const session = useRef<PlacesSession | null>(null)
    const asked = useRef(0)
    // The address now, for the English label arriving after a pick.
    const latest = useRef(value)
    latest.current = value
    const mounted = useRef(true)
    useEffect(() => {
        mounted.current = true
        return () => {
            mounted.current = false
        }
    }, [])

    const load = () => {
        api.current ??= places().catch((error: unknown) => {
            api.current = null
            throw error
        })
        return api.current
    }

    // Asks for places once typing pauses; only the latest answer shows.
    useEffect(() => {
        const text = query.trim()
        if (!editing || !text) return
        const ask = ++asked.current
        const timer = setTimeout(() => {
            load()
                .then((loaded) => {
                    session.current ??= loaded.session()
                    return session.current.suggest(text)
                })
                .then(
                    (found) => {
                        if (ask !== asked.current) return
                        setSuggestions(found)
                        setSearched(true)
                        setUnavailable(false)
                        setActive(0)
                    },
                    () => {
                        if (ask === asked.current) setUnavailable(true)
                    },
                )
        }, DEBOUNCE_MS)
        return () => clearTimeout(timer)
        // `load` reads refs only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, editing])

    const open = editing && query.trim() !== "" && searched
    const current = Math.min(active, suggestions.length - 1)

    const pick = (place: PlaceSuggestion) => {
        setEditing(false)
        setSuggestions([])
        setSearched(false)
        const search = session.current
        session.current = null
        if (place.placeId === value?.placeId) return
        const picked = { label: place.label, placeId: place.placeId }
        onChange(picked)
        latest.current = picked
        if (!search) return
        // Ends the session; a failure leaves the address without it (the
        // save looks again).
        void pickedPlaceInEnglish(search, place.placeId).then((english) => {
            const current = latest.current
            if (
                english &&
                mounted.current &&
                current?.placeId === place.placeId &&
                !current.enLabel
            ) {
                onChange({ ...current, enLabel: english })
            }
        })
    }

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!open || suggestions.length === 0) {
            if (event.key === "Enter") event.preventDefault()
            return
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            const step = event.key === "ArrowDown" ? 1 : -1
            setActive(
                (current + step + suggestions.length) % suggestions.length,
            )
        } else if (event.key === "Enter") {
            event.preventDefault()
            pick(suggestions[current])
        } else if (event.key === "Escape") {
            event.preventDefault()
            setSearched(false)
        }
    }

    const optionId = (index: number) => `${id}-place-${index}`
    const expanded = open && suggestions.length > 0
    return (
        <div
            className={`form-field combobox-field address-field${error ? " invalid" : ""}`}
        >
            <label htmlFor={id} className="visually-hidden">
                {copy.address}
            </label>
            <input
                id={id}
                className="form-input"
                role="combobox"
                aria-expanded={expanded}
                aria-controls={`${id}-list`}
                aria-autocomplete="list"
                aria-activedescendant={expanded ? optionId(current) : undefined}
                autoComplete="off"
                placeholder={copy.address}
                value={editing ? query : (value?.label ?? "")}
                onFocus={() => {
                    // Google's script loads now, in the background.
                    load().catch(() => setUnavailable(true))
                    setQuery(value?.label ?? "")
                    setEditing(true)
                }}
                onChange={(event) => {
                    setQuery(event.target.value)
                    setSearched(false)
                }}
                onBlur={() => {
                    setEditing(false)
                    setSearched(false)
                    onBlur?.()
                }}
                onKeyDown={onKeyDown}
                {...(error
                    ? {
                          "aria-invalid": true,
                          "aria-describedby": `${id}-error`,
                      }
                    : {})}
            />
            <ul
                id={`${id}-list`}
                role="listbox"
                aria-label={copy.address}
                className="form-options"
                hidden={!expanded}
            >
                {expanded &&
                    suggestions.map((place, index) => (
                        // The keyboard picks through the combobox
                        // (aria-activedescendant), not on the option.
                        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                        <li
                            key={place.placeId}
                            id={optionId(index)}
                            role="option"
                            aria-selected={index === current}
                            className="form-option"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => pick(place)}
                        >
                            {place.label}
                        </li>
                    ))}
            </ul>
            {editing && unavailable && (
                <p className="form-hint" role="status">
                    {copy.addressUnavailable}
                </p>
            )}
            {open && !unavailable && suggestions.length === 0 && (
                <p className="form-hint" role="status">
                    {copy.noAddresses}
                </p>
            )}
            {error && (
                <p id={`${id}-error`} className="form-error">
                    {error}
                </p>
            )}
        </div>
    )
}
