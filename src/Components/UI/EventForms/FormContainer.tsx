import { useWindowSize } from "../../../hooks/useWindowSize"
import { CIEvent, CITemplate } from "../../../util/interfaces"
import { ScreenSize } from "../../../util/options"
import { FormDrawer } from "./FormDrawer"
import FormModal from "./FormModal"

export default function FormContainer({
    anchorEl,
    eventType,
    isTemplate,
    event,
    template,
}: {
    anchorEl: any
    eventType: string
    isTemplate: boolean
    event?: CIEvent
    template?: CITemplate
}) {
    const { width } = useWindowSize()
    const isMobile = width < ScreenSize.mobile
    return isMobile ? (
        <FormDrawer
            anchorEl={anchorEl}
            eventType={eventType}
            isTemplate={isTemplate}
            event={event}
            template={template}
        />
    ) : (
        <FormModal
            anchorEl={anchorEl}
            eventType={eventType}
            isTemplate={isTemplate}
            event={event}
            template={template}
        />
    )
}
