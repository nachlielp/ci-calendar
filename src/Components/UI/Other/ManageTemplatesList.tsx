import List from "antd/es/list"
import Skeleton from "antd/es/skeleton"
import DeleteTemplateButton from "./DeleteTemplateButton"
import { Icon } from "./Icon"
import FormContainer from "../EventForms/FormContainer"
import { useUser } from "../../../context/UserContext"
import { useCIEvents } from "../../../context/CIEventsContext"

export default function ManageTemplatesList() {
    const { updateEventState } = useCIEvents()
    const { user } = useUser()
    if (!user) {
        return null
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
                                    {/* <button
                                        key="list-btn-share"
                                        className="list-btn"
                                    >
                                        שיתוף
                                    </button> */}
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
