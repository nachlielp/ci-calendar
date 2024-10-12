import useTemplates from "../../../hooks/useTemplates"
import { List, Skeleton } from "antd"
import DeleteTemplateButton from "./DeleteTemplateButton"
import { Icon } from "./Icon"
import FormContainer from "../EventForms/FormContainer"
// import { useEffect } from "react"

export default function ManageTemplatesList() {
    const { templates } = useTemplates({ isMultiDay: null })

    // useEffect(() => {
    //     console.log("templates: ", templates)
    // }, [templates])

    return (
        <section className="manage-templates-table">
            <h2 className="list-title">תבניות</h2>
            <List
                className="demo-loadmore-list"
                itemLayout="horizontal"
                dataSource={templates}
                renderItem={(template) => (
                    <List.Item>
                        <Skeleton loading={!templates}>
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
