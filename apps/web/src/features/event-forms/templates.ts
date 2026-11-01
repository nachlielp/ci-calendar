import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useLocation } from "react-router"
import { useServices } from "../../app/services"
import type { Submission } from "../../app/useForm"
import type { FormValues } from "@ci-calendar/core/lib/form"
import { refreshEventQueries } from "@ci-calendar/core/features/events/eventCache"
import {
    cacheTemplate,
    createTemplate,
    deleteTemplate,
    myTemplatesKey,
    myTemplatesQuery,
    TemplateGoneError,
    updateTemplate,
    type NewTemplateColumns,
    type TemplateDelete,
} from "@ci-calendar/core/features/event-forms/templates"
import type {
    Template,
    TemplatePatch,
} from "@ci-calendar/core/features/event-forms/templateValues"

// The templates' hooks; the queries and saves are the core's
// features/event-forms/templates.ts.

/** The user's templates (loaded when the calling page mounts). */
export function useMyTemplates(userId: string) {
    const services = useServices()
    return useQuery({
        ...myTemplatesQuery(services, userId),
        enabled: !!userId,
    })
}

/** Saves a new template of the user's (`createTemplate`). */
export function useCreateTemplate(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (template: { id: string; columns: NewTemplateColumns }) =>
            createTemplate(services, userId, template),
        onSuccess: (template) => cacheTemplate(queryClient, userId, template),
        onError: (error) =>
            services.telemetry.captureError(error, { source: "template-save" }),
    })
}

/** Updates one of the user's templates (`updateTemplate`). */
export function useUpdateTemplate(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (edit: { id: string; patch: TemplatePatch }) =>
            updateTemplate(services, queryClient, userId, edit),
        onSuccess: (template) => cacheTemplate(queryClient, userId, template),
        onError: (error) => {
            if (!(error instanceof TemplateGoneError)) {
                services.telemetry.captureError(error, {
                    source: "template-save",
                })
            }
        },
    })
}

/** Deletes one of the user's templates (`deleteTemplate`). */
export function useDeleteTemplate(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (change: TemplateDelete) =>
            deleteTemplate(services, userId, change),
        onSuccess: (id) => {
            queryClient.setQueryData<Template[]>(
                myTemplatesKey(userId),
                (templates) =>
                    templates?.filter((template) => template.id !== id),
            )
            refreshEventQueries(queryClient)
        },
        onError: (error) =>
            services.telemetry.captureError(error, {
                source: "template-delete",
            }),
    })
}

/**
 * The template forms' save (as `useEventSubmit` is the event forms'): a
 * new template is inserted with `columns(values)` and an id made once per
 * form; an edit sends `patch(values, changes)` (nothing when clean). Then
 * the draft goes and the form is done. Returns `failed` and `gone` for the
 * form's footer.
 */
export function useTemplateSubmit<V extends FormValues>({
    userId,
    template,
    columns,
    patch,
    discardDraft,
    onDone,
}: {
    userId: string
    /** The template being edited; unset for a new one. */
    template?: Template
    columns: (values: V) => NewTemplateColumns
    patch: (values: V, changes: Partial<V>) => TemplatePatch
    discardDraft: () => void
    onDone: () => void
}) {
    const [id] = useState(() => crypto.randomUUID())
    const create = useCreateTemplate(userId)
    const update = useUpdateTemplate(userId)
    const save = async ({ values, changes, isDirty }: Submission<V>) => {
        if (template) {
            if (isDirty) {
                await update.mutateAsync({
                    id: template.id,
                    patch: patch(values, changes),
                })
            }
        } else {
            await create.mutateAsync({ id, columns: columns(values) })
        }
        discardDraft()
        onDone()
    }
    const gone = update.error instanceof TemplateGoneError
    return {
        save,
        gone,
        failed: (create.isError || update.isError) && !gone,
    }
}

/**
 * Legacy's new-template link: the new-event pages with `?isTemplate=true`.
 * (Read from the location, not `useSearchParams`, which `/` doesn't carry.)
 */
export function useIsTemplate() {
    const { search } = useLocation()
    return new URLSearchParams(search).get("isTemplate") === "true"
}
