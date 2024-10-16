import Modal from "antd/es/modal"
import { Icon } from "./Icon"
import { templateService } from "../../../supabase/templateService"

const { confirm } = Modal

const showDeleteConfirm = (templateId: string) => {
    confirm({
        title: <div>מחיקת תבנית</div>,
        icon: <Icon icon="warning" />,
        content: (
            <div>
                האם אתם בטוחים שאתם רוצים למחוק את התבנית ? מחיקת התבנית תמחק את
                כל הארועים שנוצרו מתוך התבנית.
            </div>
        ),
        okText: "מחיקה",
        okType: "danger",
        cancelText: "ביטול",
        direction: "rtl",
        onOk() {
            templateService.deleteTemplate(templateId)
        },
        onCancel() {
            console.log(
                "DeleteEvent.showDeleteConfirm.onCancel: User cancelled deletion"
            )
        },
    })
}

interface IDeleteTemplateProps {
    templateId: string
}

export default function DeleteTemplateButton({
    templateId,
}: IDeleteTemplateProps) {
    return (
        <button
            className="list-btn"
            onClick={() => showDeleteConfirm(templateId)}
        >
            <Icon icon="deleteIcon" />
        </button>
    )
}
