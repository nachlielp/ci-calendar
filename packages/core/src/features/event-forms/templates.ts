import { type QueryClient } from "@tanstack/query-core"
import { queryOptions } from "../../app/queryOptions"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import type { CoreServices } from "../../app/services"
import type { Database } from "../../data/database.types"
import { jerusalemToday } from "../../lib/jerusalemDate"
import { deleteEventRows } from "../events/eventWrites"
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
export function myTemplatesQuery(services: CoreServices, userId: string) {
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

/**
 * Puts a stored template into the cached list, if it is cached (never
 * re-creating it, e.g. after a sign-out removed it).
 */
export function cacheTemplate(
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
export async function createTemplate(
    services: CoreServices,
    userId: string,
    {
        id,
        columns,
    }: {
        id: string
        columns: NewTemplateColumns
    },
): Promise<Template> {
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
}

/**
 * Updates one of the user's templates with the changed columns (legacy
 * `updateTemplate`), only while it is still theirs; gone, it fails with
 * `TemplateGoneError` and the list is refetched.
 */
export async function updateTemplate(
    services: CoreServices,
    queryClient: QueryClient,
    userId: string,
    {
        id,
        patch,
    }: {
        id: string
        patch: TemplatePatch
    },
): Promise<Template> {
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
}

export interface TemplateDelete {
    id: string
    /** Also delete the user's upcoming events made from it (past ones stay). */
    withUpcomingEvents: boolean
}

/**
 * Deletes one of the user's templates (legacy `deleteTemplate`) and takes
 * it out of the cached list. Legacy's foreign key
 * (`ci_events.source_template_id`) deleted every event made from the
 * template with it; now the events are kept unless the user chooses to
 * delete the upcoming ones. The kept events are unlinked from the template
 * first, so they stay whatever the key's delete rule (cascade until the
 * migration making it `set null` is applied). Every event list is
 * refreshed: those on screen refetch, the rest when next shown.
 */
export async function deleteTemplate(
    services: CoreServices,
    userId: string,
    { id, withUpcomingEvents }: TemplateDelete,
): Promise<string> {
    await sessionOf(services, userId)
    const { data } = services
    if (withUpcomingEvents) {
        const upcoming = await data
            .from("ci_events")
            .select("id")
            .eq("source_template_id", id)
            .eq("user_id", userId)
            .gte("start_date", jerusalemToday(services.now()))
        if (upcoming.error) throw new Error(upcoming.error.message)
        if (upcoming.data.length > 0) {
            const deleted = await deleteEventRows(
                data,
                upcoming.data.map((row) => row.id),
                (query) => query.eq("user_id", userId),
            )
            if (deleted.error) throw new Error(deleted.error.message)
        }
    }
    // Not scoped to the user: RLS lets them unlink only their own
    // events (an admin any), and no event is left for the key.
    const unlinked = await data
        .from("ci_events")
        .update({ source_template_id: null })
        .eq("source_template_id", id)
    if (unlinked.error) throw new Error(unlinked.error.message)
    const { error } = await data
        .from("templates")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id")
    if (error) throw new Error(error.message)
    return id
}
