import { useEffect } from "react"
import { useCopy } from "../../app/language"
import { SelectField } from "../../ui/form/fields"
import { TEMPLATE_COPY } from "./templateCopy"
import { useMyTemplates } from "./templates"
import type { Template } from "./templateValues"

/**
 * Legacy's "בחירת תבנית" at the top of the new-event forms: the user's
 * templates of the form's kind (read as the form opens), by name. Picking
 * one fills the form (`onPick`); picking none again forgets which template
 * the event came from (`onClear`) and leaves the form as it is, as legacy's
 * clear did. A template no longer among the user's (deleted since a draft
 * named it) is forgotten the same way once the list has loaded, so the
 * event isn't saved naming it.
 */
export function TemplatePicker({
    userId,
    multiDay,
    value,
    onPick,
    onClear,
}: {
    userId: string
    multiDay: boolean
    /** The chosen template's id (`""`: none). */
    value: string
    onPick: (template: Template) => void
    onClear: () => void
}) {
    const copy = useCopy(TEMPLATE_COPY)
    const templates = useMyTemplates(userId)
    const known = templates.isSuccess ? templates.data : undefined
    useEffect(() => {
        if (known && value && !known.some((template) => template.id === value))
            onClear()
    }, [known, value, onClear])
    const offered = (templates.data ?? []).filter(
        (template) => template.multiDay === multiDay,
    )
    return (
        <SelectField
            label={copy.choose}
            labelAsPlaceholder
            options={[
                { value: "", label: copy.choose },
                ...offered.map((template) => ({
                    value: template.id,
                    label: template.name,
                })),
            ]}
            value={value}
            onChange={(id) => {
                const template = offered.find((other) => other.id === id)
                if (template) onPick(template)
                else onClear()
            }}
        />
    )
}
