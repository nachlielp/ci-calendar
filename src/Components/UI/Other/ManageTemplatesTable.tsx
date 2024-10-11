import useTemplates from "../../../hooks/useTemplates"
import { List, Skeleton } from "antd"
import DeleteTemplateButton from "./DeleteTemplateButton"
import { Icon } from "./Icon"
import FormModal from "../EventForms/FormModal"
import { useWindowSize } from "../../../hooks/useWindowSize"
import { ScreenSize } from "../../../util/options"
import { FormDrawer } from "../EventForms/FormDrawer"

export default function ManageTemplatesTable() {
    const { templates } = useTemplates({ isMultiDay: null })
    const { width } = useWindowSize()
    const isMobile = width < ScreenSize.mobile
    console.log("isMobile", isMobile)
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
                                    {isMobile ? (
                                        <FormDrawer
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
                                            itemId={template.template_id}
                                        />
                                    ) : (
                                        <FormModal
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
                                            itemId={template.template_id}
                                        />
                                    )}
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
