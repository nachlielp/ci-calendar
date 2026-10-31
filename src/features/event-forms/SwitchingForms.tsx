import { useState, type ReactNode } from "react"

/**
 * The single-day (`S` values) or multi-day (`M`) form, and what the other
 * one handed over when the user switched: kept here, above the forms, as
 * the switch unmounts the one and mounts the other.
 */
export function SwitchingForms<S, M>({
    multiDay,
    onSwitch,
    single,
    multi,
}: {
    multiDay: boolean
    onSwitch: (multiDay: boolean) => void
    single: (
        carried: S | undefined,
        toMultiDay: (values: M) => void,
    ) => ReactNode
    multi: (
        carried: M | undefined,
        toSingleDay: (values: S) => void,
    ) => ReactNode
}) {
    const [carried, setCarried] = useState<{ single?: S; multi?: M }>({})
    return multiDay
        ? multi(carried.multi, (values) => {
              setCarried({ single: values })
              onSwitch(false)
          })
        : single(carried.single, (values) => {
              setCarried({ multi: values })
              onSwitch(true)
          })
}
