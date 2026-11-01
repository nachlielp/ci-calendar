import { useId, useState } from "react"
import { useCopy } from "../../app/language"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"
import { Dialog } from "../../ui/Dialog"
import { DeleteIcon } from "../../ui/icons/DeleteIcon"
import { EditIcon } from "../../ui/icons/EditIcon"
import { ActionDialog } from "../events/ActionDialog"
import { TEMPLATE_COPY } from "./templateCopy"
import { MultiDayTemplateForm, SingleDayTemplateForm } from "./TemplateForms"
import { useDeleteTemplate, useMyTemplates } from "./templates"
import type { Template } from "./templateValues"
import "./ManageTemplatesList.scss"

/**
 * Legacy ManageTemplatesList (under the create-events chooser): the
 * user's templates, newest first, each with edit (its form in a drawer on
 * phones, a modal on wider screens, as legacy's FormContainer) and delete
 * (legacy's confirm). Both update the list from the server's answer.
 */
export function ManageTemplatesList({ userId }: { userId: string }) {
    const copy = useCopy(TEMPLATE_COPY)
    const common = useCopy(COMMON_COPY)
    const templates = useMyTemplates(userId)
    const [editing, setEditing] = useState<Template | null>(null)
    const [deleting, setDeleting] = useState<Template | null>(null)
    const titleId = useId()

    let body
    if (templates.isPending) {
        body = <p role="status">{common.loading}</p>
    } else if (templates.isError) {
        body = (
            <div role="alert">
                <p>{copy.loadFailed}</p>
                <button
                    type="button"
                    className="text-button"
                    onClick={() => void templates.refetch()}
                >
                    {common.retry}
                </button>
            </div>
        )
    } else {
        body = (
            <ul className="templates-list">
                {templates.data.map((template) => (
                    <li className="template-item" key={template.id}>
                        <h3 className="template-name">{template.name}</h3>
                        <div className="template-actions">
                            <button
                                type="button"
                                className="list-btn"
                                aria-label={copy.edit(template.name)}
                                onClick={() => setEditing(template)}
                            >
                                <EditIcon className="icon" />
                            </button>
                            <button
                                type="button"
                                className="list-btn"
                                aria-label={copy.delete(template.name)}
                                onClick={() => setDeleting(template)}
                            >
                                <DeleteIcon className="icon" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        )
    }

    return (
        <section className="manage-templates-list" aria-labelledby={titleId}>
            <h2 className="list-title" id={titleId}>
                {copy.list}
            </h2>
            {body}
            {editing && (
                <EditTemplateDialog
                    userId={userId}
                    template={editing}
                    onClose={() => setEditing(null)}
                />
            )}
            {deleting && (
                <DeleteTemplateDialog
                    userId={userId}
                    template={deleting}
                    onClose={() => setDeleting(null)}
                />
            )}
        </section>
    )
}

/** Legacy FormContainer with an edit form for the template. */
function EditTemplateDialog({
    userId,
    template,
    onClose,
}: {
    userId: string
    template: Template
    onClose: () => void
}) {
    const copy = useCopy(TEMPLATE_COPY)
    const Form = template.multiDay
        ? MultiDayTemplateForm
        : SingleDayTemplateForm
    return (
        <Dialog
            label={template.multiDay ? copy.editMultiDay : copy.editSingleDay}
            onClose={onClose}
        >
            <Form userId={userId} template={template} onDone={onClose} />
        </Dialog>
    )
}

/**
 * Legacy DeleteTemplateButton's confirm, which now keeps the template's
 * events unless the user ticks deleting the upcoming ones too.
 */
function DeleteTemplateDialog({
    userId,
    template,
    onClose,
}: {
    userId: string
    template: Template
    onClose: () => void
}) {
    const copy = useCopy(TEMPLATE_COPY)
    const remove = useDeleteTemplate(userId)
    const [withUpcomingEvents, setWithUpcomingEvents] = useState(false)
    return (
        <ActionDialog
            title={copy.deleteTitle}
            ok={copy.deleteOk}
            warning
            pending={remove.isPending}
            failed={remove.isError}
            onOk={() =>
                remove.mutate(
                    { id: template.id, withUpcomingEvents },
                    { onSuccess: onClose },
                )
            }
            onClose={onClose}
        >
            <p>{copy.deleteQuestion}</p>
            <label className="series-option">
                <input
                    type="checkbox"
                    checked={withUpcomingEvents}
                    onChange={() => setWithUpcomingEvents((value) => !value)}
                />
                {copy.deleteEventsToo}
            </label>
        </ActionDialog>
    )
}
