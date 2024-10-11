import useTemplates from "../../../hooks/useTemplates"
import { List, Skeleton } from "antd"
import DeleteTemplateButton from "./DeleteTemplateButton"
import { useNavigate } from "react-router-dom"
import { Icon } from "./Icon"

export default function ManageTemplatesTable() {
    const { templates } = useTemplates({ isMultiDay: null })
    const navigate = useNavigate()
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
                                    <button
                                        key="list-btn-share"
                                        className="list-btn"
                                    >
                                        שיתוף
                                    </button>
                                    <button
                                        key="list-btn-edit"
                                        className="list-btn"
                                        onClick={() =>
                                            navigate(
                                                `/edit-${
                                                    template.is_multi_day
                                                        ? "multi"
                                                        : "single"
                                                }-day-template/${
                                                    template.template_id
                                                }`
                                            )
                                        }
                                    >
                                        <Icon icon="edit" />
                                    </button>
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
