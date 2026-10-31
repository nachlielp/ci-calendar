import { useLocation, useNavigate } from "react-router"
import { useCopy } from "../../app/language"
import { editPath, type ManagedEvent } from "../events/managedEvent"
import {
    MULTI_DAY_EDIT_DRAFT_KEY,
    SINGLE_DAY_EDIT_DRAFT_KEY,
} from "./draftKeys"
import { EditEventFormPage, type EditPageState } from "./EventFormPages"
import type { MultiDayValues, SingleDayValues } from "./eventFormValues"
import { FORM_PAGE_COPY } from "./formPageCopy"
import { MultiDayEventForm } from "./MultiDayEventForm"
import { SingleDayEventForm } from "./SingleDayEventForm"
import { SwitchingForms } from "./SwitchingForms"

const MULTI_DAY_EDIT_PREFIX = "/manage-events/edit-multi-day/"

/**
 * Legacy's edit pages (`/manage-events/edit-single-day/:eventId` and
 * `…/edit-multi-day/:eventId`): one of the user's own events in its form.
 * An event that doesn't repeat (every multi-day one, and a single-day one
 * outside a recurring series) has the "multi-day event" switch, as a new
 * event's form: it moves to the other path (replacing it, with
 * `switched` in the history state, so a reload keeps the switched form
 * and its draft) and swaps the form, carrying over what was filled in.
 * Saved, the event becomes the other kind.
 */
export default function EditEventPage() {
    const copy = useCopy(FORM_PAGE_COPY)
    const location = useLocation()
    const navigate = useNavigate()
    const multiDay = location.pathname.startsWith(MULTI_DAY_EDIT_PREFIX)
    const state = location.state as EditPageState | null
    const switchKind = (event: ManagedEvent, toMultiDay: boolean) =>
        void navigate(
            {
                pathname: editPath({ ...event, multiDay: toMultiDay }),
                search: location.search,
            },
            { replace: true, state: { ...state, switched: true } },
        )
    return (
        <EditEventFormPage
            title={multiDay ? copy.editMultiDay : copy.editSingleDay}
            multiDay={multiDay}
            draftKeys={[SINGLE_DAY_EDIT_DRAFT_KEY, MULTI_DAY_EDIT_DRAFT_KEY]}
            form={({ event, ...slot }) => {
                const switchable = !event.recurringRefKey
                return (
                    <SwitchingForms<SingleDayValues, MultiDayValues>
                        key={event.id}
                        multiDay={multiDay}
                        onSwitch={(toMultiDay) => switchKind(event, toMultiDay)}
                        single={(carried, toMultiDay) => (
                            <SingleDayEventForm
                                {...slot}
                                event={event}
                                carried={carried}
                                onSwitchKind={
                                    switchable ? toMultiDay : undefined
                                }
                            />
                        )}
                        multi={(carried, toSingleDay) => (
                            <MultiDayEventForm
                                {...slot}
                                event={event}
                                carried={carried}
                                onSwitchKind={
                                    switchable ? toSingleDay : undefined
                                }
                            />
                        )}
                    />
                )
            }}
        />
    )
}
