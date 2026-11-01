import { useLocation, useNavigate } from "react-router"
import { useCopy } from "../../app/language"
import { NewEventFormPage } from "./EventFormPages"
import type {
    MultiDayValues,
    SingleDayValues,
} from "@ci-calendar/core/features/event-forms/eventFormValues"
import { FORM_PAGE_COPY } from "@ci-calendar/core/features/event-forms/formPageCopy"
import { MultiDayEventForm } from "./MultiDayEventForm"
import { SingleDayEventForm } from "./SingleDayEventForm"
import { SwitchingForms } from "./SwitchingForms"
import { TEMPLATE_COPY } from "@ci-calendar/core/features/event-forms/templateCopy"
import { MultiDayTemplateForm, SingleDayTemplateForm } from "./TemplateForms"
import { useIsTemplate } from "./templates"
import type {
    MultiDayTemplateValues,
    SingleDayTemplateValues,
} from "@ci-calendar/core/features/event-forms/templateValues"

const SINGLE_DAY_PATH = "/create-events/single-day"
const MULTI_DAY_PATH = "/create-events/multi-day"

/**
 * A new event, or with `?isTemplate=true` (legacy's link) a new template,
 * at legacy's two paths (`/create-events/single-day` and `…/multi-day`):
 * one form, single-day by default, whose "multi-day event" switch moves to
 * the other path (replacing it, so back still leaves the page) and swaps
 * the form, carrying over what was filled in. The path keeps the kind
 * across reloads, with that kind's draft.
 */
export default function NewEventPage() {
    const copy = useCopy(FORM_PAGE_COPY)
    const templateCopy = useCopy(TEMPLATE_COPY)
    const isTemplate = useIsTemplate()
    const location = useLocation()
    const navigate = useNavigate()
    const multiDay = location.pathname === MULTI_DAY_PATH
    const switchKind = (toMultiDay: boolean) =>
        void navigate(
            {
                pathname: toMultiDay ? MULTI_DAY_PATH : SINGLE_DAY_PATH,
                search: location.search,
            },
            { replace: true },
        )
    const words = isTemplate ? templateCopy : copy
    return (
        <NewEventFormPage
            title={multiDay ? words.multiDay : words.singleDay}
            notice={multiDay ? copy.multiDayNotice : undefined}
            // Clearing remounts the forms, forgetting what was carried.
            form={({ key, ...slot }) =>
                isTemplate ? (
                    <SwitchingForms<
                        SingleDayTemplateValues,
                        MultiDayTemplateValues
                    >
                        key={key}
                        multiDay={multiDay}
                        onSwitch={switchKind}
                        single={(carried, toMultiDay) => (
                            <SingleDayTemplateForm
                                {...slot}
                                carried={carried}
                                onSwitchKind={toMultiDay}
                            />
                        )}
                        multi={(carried, toSingleDay) => (
                            <MultiDayTemplateForm
                                {...slot}
                                carried={carried}
                                onSwitchKind={toSingleDay}
                            />
                        )}
                    />
                ) : (
                    <SwitchingForms<SingleDayValues, MultiDayValues>
                        key={key}
                        multiDay={multiDay}
                        onSwitch={switchKind}
                        single={(carried, toMultiDay) => (
                            <SingleDayEventForm
                                {...slot}
                                carried={carried}
                                onSwitchKind={toMultiDay}
                            />
                        )}
                        multi={(carried, toSingleDay) => (
                            <MultiDayEventForm
                                {...slot}
                                carried={carried}
                                onSwitchKind={toSingleDay}
                            />
                        )}
                    />
                )
            }
        />
    )
}
