import { useCallback, useMemo } from "react"
import { useCopy } from "../../app/language"
import { useForm } from "../../app/useForm"
import { useToday } from "../../app/useToday"
import { useViewer } from "../../app/viewer"
import { TextField } from "../../ui/form/fields"
import {
    MULTI_DAY_TEMPLATE_DRAFT_KEY,
    SINGLE_DAY_TEMPLATE_DRAFT_KEY,
} from "@ci-calendar/core/features/event-forms/draftKeys"
import { useFormDraft } from "../../app/useFormDraft"
import {
    ClearFormButton,
    EventFormFooter,
    MultiDaySwitch,
} from "./EventFormParts"
import { MultiDayHeadFields } from "./MultiDayEventForm"
import { SingleDayFields } from "./SingleDayEventForm"
import { useTaggable } from "./taggableBios"
import { TEMPLATE_COPY } from "@ci-calendar/core/features/event-forms/templateCopy"
import { useTemplateSubmit } from "./templates"
import {
    emptyMultiDayTemplate,
    emptySingleDayTemplate,
    isMultiDayTemplateValues,
    isSingleDayTemplateValues,
    multiDayTemplateColumns,
    multiDayTemplatePatch,
    multiDayTemplateValuesOf,
    multiToSingleDayTemplate,
    singleDayTemplateColumns,
    singleDayTemplatePatch,
    singleDayTemplateValuesOf,
    singleToMultiDayTemplate,
    validateMultiDayTemplate,
    validateSingleDayTemplate,
    type MultiDayTemplateValues,
    type SingleDayTemplateValues,
    type Template,
} from "@ci-calendar/core/features/event-forms/templateValues"
import { useCarried } from "./useCarried"
import { useErrorText } from "./useErrorText"

// The template forms (legacy SingleDayEventForm / MultiDayEventForm with
// `isTemplate`, and their edit forms with a `template`): the event forms'
// cards without the days, recurrence and hide switch, plus the template's
// name, saved to `templates`. A new template's form keeps a draft on the
// device (its own key, legacy's `…-draft-template`); an edit's doesn't, as
// legacy's didn't. A new template can be switched between single-day and
// multi-day, keeping what was filled in.

interface TemplateFormProps<V, Other> {
    userId: string
    /** The template being edited; unset for a new one. */
    template?: Template
    onDone: () => void
    /** Clears a new template's form (it remounts empty). */
    onClear?: () => void
    /** What a new template's form had before the user switched it to this. */
    carried?: V
    /** Switches a new template's form to the other kind, with these values. */
    onSwitchKind?: (values: Other) => void
}

/** The name: beside "clear form" for a new template, labelled for an edit. */
function NameField({
    value,
    error,
    asPlaceholder,
    onChange,
    onBlur,
}: {
    value: string
    error?: string
    asPlaceholder: boolean
    onChange: (name: string) => void
    onBlur: () => void
}) {
    const copy = useCopy(TEMPLATE_COPY)
    return (
        <TextField
            label={copy.name}
            labelAsPlaceholder={asPlaceholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            error={error}
        />
    )
}

/** A single-day template, new or edited. */
export function SingleDayTemplateForm({
    userId,
    template,
    onDone,
    onClear,
    carried,
    onSwitchKind,
}: TemplateFormProps<SingleDayTemplateValues, MultiDayTemplateValues>) {
    const copy = useCopy(TEMPLATE_COPY)
    const today = useToday()
    const saved = useMemo(
        () =>
            template
                ? singleDayTemplateValuesOf(template)
                : emptySingleDayTemplate(),
        [template],
    )
    const form = useForm({ saved, validate: validateSingleDayTemplate })
    const discardDraft = useFormDraft({
        key: template ? null : SINGLE_DAY_TEMPLATE_DRAFT_KEY,
        userId,
        saved,
        form,
        isValues: isSingleDayTemplateValues,
    })
    useCarried(form.restore, carried)
    const taggable = useTaggable(userId)
    const submit = useTemplateSubmit({
        userId,
        template,
        columns: useCallback(
            (values: SingleDayTemplateValues) =>
                singleDayTemplateColumns(values, today),
            [today],
        ),
        patch: useCallback(
            (
                values: SingleDayTemplateValues,
                changes: Partial<SingleDayTemplateValues>,
            ) => singleDayTemplatePatch(values, changes, today),
            [today],
        ),
        discardDraft,
        onDone,
    })
    const { values, errors, set, touch } = form
    const errorAt = useErrorText(errors)
    const name = (
        <NameField
            value={values.name}
            error={errorAt("name")}
            asPlaceholder={!template}
            onChange={(text) => set("name", text)}
            onBlur={() => touch("name")}
        />
    )
    return (
        <div className="event-form">
            <form onSubmit={form.handleSubmit(submit.save)} noValidate>
                {onClear ? (
                    <ClearFormButton
                        onClear={() => {
                            discardDraft()
                            onClear()
                        }}
                    >
                        {name}
                    </ClearFormButton>
                ) : (
                    name
                )}
                {onSwitchKind && (
                    <MultiDaySwitch
                        checked={false}
                        onSwitch={() => {
                            discardDraft()
                            onSwitchKind(singleToMultiDayTemplate(values))
                        }}
                    />
                )}
                <SingleDayFields
                    form={form}
                    heading={
                        template
                            ? copy.editSingleDayTitle
                            : copy.createSingleDayTitle
                    }
                    taggable={taggable}
                />
                <EventFormFooter
                    form={form}
                    submitLabel={template ? copy.update : copy.create}
                    saving={form.submitting}
                    failed={submit.failed}
                    gone={submit.gone}
                    goneText={copy.gone}
                    canHide={false}
                />
            </form>
        </div>
    )
}

/** A multi-day template, new or edited. */
export function MultiDayTemplateForm({
    userId,
    template,
    onDone,
    onClear,
    carried,
    onSwitchKind,
}: TemplateFormProps<MultiDayTemplateValues, SingleDayTemplateValues>) {
    const copy = useCopy(TEMPLATE_COPY)
    const viewer = useViewer()
    const saved = useMemo(
        () =>
            template
                ? multiDayTemplateValuesOf(template)
                : emptyMultiDayTemplate(),
        [template],
    )
    const form = useForm({ saved, validate: validateMultiDayTemplate })
    const discardDraft = useFormDraft({
        key: template ? null : MULTI_DAY_TEMPLATE_DRAFT_KEY,
        userId,
        saved,
        form,
        isValues: isMultiDayTemplateValues,
    })
    useCarried(form.restore, carried)
    const taggable = useTaggable(userId)
    const creatorName = "name" in viewer ? viewer.name : ""
    const submit = useTemplateSubmit({
        userId,
        template,
        columns: useCallback(
            (values: MultiDayTemplateValues) => ({
                ...multiDayTemplateColumns(values),
                // Legacy's multi-day template named its creator here, as
                // its events did.
                owners: [{ value: userId, label: creatorName }],
            }),
            [userId, creatorName],
        ),
        patch: multiDayTemplatePatch,
        discardDraft,
        onDone,
    })
    const { values, errors, set, touch } = form
    const errorAt = useErrorText(errors)
    const name = (
        <NameField
            value={values.name}
            error={errorAt("name")}
            asPlaceholder={!template}
            onChange={(text) => set("name", text)}
            onBlur={() => touch("name")}
        />
    )
    return (
        <div className="event-form">
            <form onSubmit={form.handleSubmit(submit.save)} noValidate>
                {onClear ? (
                    <ClearFormButton
                        onClear={() => {
                            discardDraft()
                            onClear()
                        }}
                    >
                        {name}
                    </ClearFormButton>
                ) : (
                    name
                )}
                {onSwitchKind && (
                    <MultiDaySwitch
                        checked
                        onSwitch={() => {
                            discardDraft()
                            onSwitchKind(multiToSingleDayTemplate(values))
                        }}
                    />
                )}
                <MultiDayHeadFields
                    form={form}
                    heading={
                        template
                            ? copy.editMultiDayTitle
                            : copy.createMultiDayTitle
                    }
                    taggable={taggable}
                />
                <EventFormFooter
                    form={form}
                    submitLabel={template ? copy.update : copy.create}
                    saving={form.submitting}
                    failed={submit.failed}
                    gone={submit.gone}
                    goneText={copy.gone}
                    canHide={false}
                />
            </form>
        </div>
    )
}
