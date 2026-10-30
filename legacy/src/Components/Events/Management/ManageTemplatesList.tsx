import FormContainer from "../Forms/FormContainer"
import DeleteTemplateButton from "../Actions/DeleteTemplateButton"
import { Icon } from "../../Common/Icon"
import { observer } from "mobx-react-lite"
import { store } from "../../../Store/store"
import "../../../styles/manage-templates-list.scss"
import edit from "../../../assets/svgs/edit.svg"
//TODO move edit to page with save state
const ManageTemplatesList = () => {
    async function handleDeleteTemplate(templateId: string) {
        await store.deleteTemplate(templateId)
    }

    return (
        <section className="manage-templates-list">
            <h2 className="list-title">תבניות</h2>

            <section className="templates-list">
                {store.getTemplates.map((template) => (
                    <article className="template-item" key={template.id}>
                        <h3 className="template-name">{template.name}</h3>
                        <div className="template-actions">
                            <FormContainer
                                anchorEl={
                                    <button
                                        key="list-btn-edit"
                                        className="list-btn"
                                    >
                                        <Icon icon={edit} />
                                    </button>
                                }
                                eventType={
                                    template.is_multi_day
                                        ? "edit-multi-day"
                                        : "edit-single-day"
                                }
                                isTemplate={true}
                                template={template}
                            />
                            <DeleteTemplateButton
                                templateId={template.id}
                                handleDeleteTemplate={handleDeleteTemplate}
                            />
                        </div>
                    </article>
                ))}
            </section>
        </section>
    )
}
export default observer(ManageTemplatesList)
