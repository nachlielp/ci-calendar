import Modal from "antd/es/modal"
import { Icon } from "../../Common/Icon"

const { confirm } = Modal

const showDeleteConfirm = (
    templateId: string,
    handleDeleteTemplate: (templateId: string) => void
) => {
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
            handleDeleteTemplate(templateId)
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
    handleDeleteTemplate: (templateId: string) => void
}

export default function DeleteTemplateButton({
    templateId,
    handleDeleteTemplate,
}: IDeleteTemplateProps) {
    return (
        <button
            className="list-btn"
            onClick={() => showDeleteConfirm(templateId, handleDeleteTemplate)}
        >
            <Icon icon="deleteIcon" />
        </button>
    )
}
