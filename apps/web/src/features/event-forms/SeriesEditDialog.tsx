import { useState } from "react"
import { useCopy } from "../../app/language"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { FormAlert } from "../../ui/form/fields"
import { ActionDialog, EventLine, SeriesChoice } from "../events/ActionDialog"
import type { ManagedEvent } from "../events/managedEvent"
import type { SeriesQuestion } from "./useEventSubmit"
import "./SeriesEditDialog.scss"

// Legacy EditRecurringEventDialog (Hebrew only there): before saving an
// edit of a recurring event, which later events of its series change too.

const COPY = defineCopy({
    he: {
        title: "עדכון אירוע",
        ok: "עדכון",
        question: "האם אתם בטוחים שאתם רוצים לעדכן את הארוע?",
        warning:
            "עדכון ארועים נוספים יעדכן את כל התוכן של האירוע למעט התאריך, ביטול והסתרה!",
    },
    en: {
        title: "Update event",
        ok: "Update",
        question: "Are you sure you want to update the event?",
        warning:
            "Updating other events changes their content too, except their date, cancellation and hiding!",
    },
    ru: {
        title: "Обновить событие",
        ok: "Обновить",
        question: "Вы уверены, что хотите обновить событие?",
        warning:
            "Обновление других событий изменит и их содержание, кроме даты, отмены и скрытия!",
    },
})

export function SeriesEditDialog({
    event,
    question,
}: {
    event: ManagedEvent
    question: SeriesQuestion
}) {
    const copy = useCopy(COPY)
    const [chosen, setChosen] = useState<string[]>([])
    return (
        <ActionDialog
            title={copy.title}
            ok={copy.ok}
            primary
            pending={false}
            failed={false}
            onOk={() => question.choose(chosen)}
            onClose={question.cancel}
        >
            <p>{copy.question}</p>
            <EventLine event={event} />
            <FormAlert kind="warning">{copy.warning}</FormAlert>
            <SeriesChoice
                series={question.later}
                chosen={chosen}
                onChange={setChosen}
            />
        </ActionDialog>
    )
}
