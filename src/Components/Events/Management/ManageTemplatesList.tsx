import List from "antd/es/list"
import Skeleton from "antd/es/skeleton"
import FormContainer from "../Forms/FormContainer"
import { useUser } from "../../../Context/UserContext"
import { useCIEvents } from "../../../Context/CIEventsContext"
import { templateService } from "../../../supabase/templateService"
import DeleteTemplateButton from "../Actions/DeleteTemplateButton"
import { Icon } from "../../Common/Icon"

export default function ManageTemplatesList() {
    const { updateEventState } = useCIEvents()
    const { user, updateUserState } = useUser()
    if (!user) {
        return null
    }

    async function handleDeleteTemplate(templateId: string) {
        await templateService.deleteTemplate(templateId)
        updateUserState({
            user_id: user?.user_id,
            templates: user?.templates.filter(
                (t) => t.template_id !== templateId
            ),
        })
    }

    return (
        <section className="manage-templates-table">
            <h2 className="list-title">תבניות</h2>
            <List
                className="demo-loadmore-list"
                itemLayout="horizontal"
                dataSource={user?.templates}
                renderItem={(template) => (
                    <List.Item>
                        <Skeleton loading={!user.templates}>
                            <article className="template-item">
                                <h3 className="template-name">
                                    {template.name}
                                </h3>
                                <div className="template-actions">
                                    <FormContainer
                                        anchorEl={
                                            <button
                                                key="list-btn-edit"
                                                className="list-btn"
                                            >
                                                <Icon icon="edit" />
                                            </button>
                                        }
                                        eventType={
                                            template.is_multi_day
                                                ? "edit-multi-day"
                                                : "edit-single-day"
                                        }
                                        isTemplate={true}
                                        template={template}
                                        updateEventState={updateEventState}
                                    />
                                    <DeleteTemplateButton
                                        templateId={template.template_id}
                                        handleDeleteTemplate={
                                            handleDeleteTemplate
                                        }
                                    />
                                </div>
                            </article>
                        </Skeleton>
                    </List.Item>
                )}
            />
        </section>
    )
}
