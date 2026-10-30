import {
    queryOptions,
    useMutation,
    useQuery,
    useQueryClient,
    type QueryClient,
} from "@tanstack/react-query"
import { useState } from "react"
import { useLocation } from "react-router"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import { useServices, type AppServices } from "../../app/services"
import type { Submission } from "../../app/useForm"
import type { Database } from "../../data/database.types"
import type { FormValues } from "../../lib/form"
import { refreshEventQueries } from "../events/eventCache"
import {
    byNewest,
    TEMPLATE_COLUMNS,
    toTemplate,
    type Template,
    type TemplateColumns,
    type TemplatePatch,
} from "./templateValues"

// The user's templates (legacy store `templates`, templateService): read
// only when a page that uses them opens (the create-events chooser and the
// new-event forms' template picker), never at boot. Personal: the user's
// own rows (`user_id`, filtered explicitly: admins' RLS returns
// everyone's), never persisted, forgotten on sign-out. Every write puts
// the stored row in the cached list (no refetch).

/** First element of the templates query key: personal, never persisted. */
export const MY_TEMPLATES_KIND = "my-templates"

export const myTemplatesKey = (userId: string) =>
    [MY_TEMPLATES_KIND, userId] as const

/** The user's templates, newest first (legacy `getTemplates`). */
export function myTemplatesQuery(services: AppServices, userId: string) {
    return queryOptions({
        queryKey: myTemplatesKey(userId),
        ...PERSONAL_FRESHNESS,
        queryFn: async (): Promise<Template[]> => {
            await sessionOf(services, userId)
            const { data, error } = await services.data
                .from("templates")
                .select(TEMPLATE_COLUMNS)
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
            if (error) throw new Error(error.message)
            return data.map(toTemplate)
        },
    })
}

/** The user's templates (loaded when the calling page mounts). */
export function useMyTemplates(userId: string) {
    const services = useServices()
    return useQuery({
        ...myTemplatesQuery(services, userId),
        enabled: !!userId,
    })
}

/**
 * Puts a stored template into the cached list, if it is cached (never
 * re-creating it, e.g. after a sign-out removed it).
 */
function cacheTemplate(
    queryClient: QueryClient,
    userId: string,
    template: Template,
) {
    queryClient.setQueryData<Template[]>(
        myTemplatesKey(userId),
        (templates) =>
            templates &&
            [
                template,
                ...templates.filter((other) => other.id !== template.id),
            ].sort(byNewest),
    )
}

/** The template is no longer the user's to edit (deleted elsewhere). */
export class TemplateGoneError extends Error {
    constructor() {
        super("The template is gone")
    }
}

/**
 * What a new template's form sends: its columns, and legacy's `owners`
 * (read by nothing): the multi-day form names its creator there, as
 * legacy's did; empty by default, as legacy's single-day form left it.
 */
export type NewTemplateColumns = TemplateColumns & {
    owners?: Database["public"]["Tables"]["templates"]["Insert"]["owners"]
}

/** Postgres' unique violation: a template with this id is stored already. */
const DUPLICATE = "23505"

/**
 * Saves a new template of the user's (legacy `createTemplate`) with an id
 * made once per form: sent again (a retry after a lost answer), it reads
 * the stored one instead of storing a second.
 */
export function useCreateTemplate(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            id,
            columns,
        }: {
            id: string
            columns: NewTemplateColumns
        }) => {
            await sessionOf(services, userId)
            const now = services.now().toISOString()
            const inserted = await services.data
                .from("templates")
                .insert({
                    ...columns,
                    id,
                    user_id: userId,
                    owners: columns.owners ?? [],
                    created_at: now,
                    updated_at: now,
                })
                .select(TEMPLATE_COLUMNS)
                .single()
            const { data, error } =
                inserted.error?.code === DUPLICATE
                    ? await services.data
                          .from("templates")
                          .select(TEMPLATE_COLUMNS)
                          .eq("id", id)
                          .eq("user_id", userId)
                          .single()
                    : inserted
            if (error) throw new Error(error.message)
            return toTemplate(data)
        },
        onSuccess: (template) => cacheTemplate(queryClient, userId, template),
        onError: (error) =>
            services.telemetry.captureError(error, { source: "template-save" }),
    })
}

/**
 * Updates one of the user's templates with the changed columns (legacy
 * `updateTemplate`), only while it is still theirs; gone, it fails with
 * `TemplateGoneError` and the list is refetched.
 */
export function useUpdateTemplate(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            id,
            patch,
        }: {
            id: string
            patch: TemplatePatch
        }) => {
            await sessionOf(services, userId)
            const { data, error } = await services.data
                .from("templates")
                .update({ ...patch, updated_at: services.now().toISOString() })
                .eq("id", id)
                .eq("user_id", userId)
                .select(TEMPLATE_COLUMNS)
                .maybeSingle()
            if (error) throw new Error(error.message)
            if (!data) {
                void queryClient.invalidateQueries({
                    queryKey: myTemplatesKey(userId),
                })
                throw new TemplateGoneError()
            }
            return toTemplate(data)
        },
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

/**
 * Deletes one of the user's templates (legacy `deleteTemplate`) and takes
 * it out of the cached list. Legacy warned that deleting a template
 * deletes the events made from it (`ci_events.source_template_id`'s
 * foreign key), so every event list is refreshed too: those on screen
 * refetch, the rest when next shown.
 */
export function useDeleteTemplate(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await sessionOf(services, userId)
            const { error } = await services.data
                .from("templates")
                .delete()
                .eq("id", id)
                .eq("user_id", userId)
                .select("id")
            if (error) throw new Error(error.message)
            return id
        },
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
