import { useIsMobile } from "../../../hooks/useIsMobile"
import { DBCIEvent } from "../../../supabase/cieventsService"
import { CIEvent, CITemplate } from "../../../util/interfaces"
import { FormDrawer } from "./FormDrawer"
import FormModal from "./FormModal"

export default function FormContainer({
    anchorEl,
    eventType,
    isTemplate,
    event,
    template,
    updateEventState,
}: {
    anchorEl: any
    eventType: string
    isTemplate: boolean
    event?: CIEvent
    template?: CITemplate
    updateEventState: (eventId: string, event: DBCIEvent) => void
}) {
    const isMobile = useIsMobile()
    return isMobile ? (
        <FormDrawer
            anchorEl={anchorEl}
            eventType={eventType}
            isTemplate={isTemplate}
            event={event}
            template={template}
            updateEventState={updateEventState}
        />
    ) : (
        <FormModal
            anchorEl={anchorEl}
            eventType={eventType}
            isTemplate={isTemplate}
            event={event}
            template={template}
            updateEventState={updateEventState}
        />
    )
}
