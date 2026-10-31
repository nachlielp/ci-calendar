import { COMMON_COPY } from "../lib/commonCopy"
import { defineCopy } from "../lib/copy"
import { Dialog } from "../ui/Dialog"
import { WarningIcon } from "../ui/icons/WarningIcon"
import { useCopy } from "./language"
import { resetDevice } from "./resetDevice"
import { useServices } from "./services"
import "./ResetAppDialog.scss"

const COPY = defineCopy({
    he: { question: "האם לאפס את האפליקציה?", reset: "איפוס" },
    en: { question: "Reset the app?", reset: "Reset" },
    ru: { question: "Сбросить приложение?", reset: "Сбросить" },
})

/** Legacy's "reset the app" confirmation, behind the footer's version. */
export default function ResetAppDialog({ onClose }: { onClose: () => void }) {
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    const { storage, reload } = useServices()

    const reset = async () => {
        await resetDevice(storage)
        reload()
    }

    return (
        <Dialog
            label={copy.question}
            onClose={onClose}
            className="reset-app-dialog"
        >
            <h2 className="reset-app-title">
                <WarningIcon className="reset-app-icon" />
                {copy.question}
            </h2>
            <div className="reset-app-actions">
                <button
                    type="button"
                    className="reset-app-btn cancel"
                    onClick={onClose}
                >
                    {common.cancel}
                </button>
                <button
                    type="button"
                    className="reset-app-btn danger"
                    onClick={reset}
                >
                    {copy.reset}
                </button>
            </div>
        </Dialog>
    )
}
