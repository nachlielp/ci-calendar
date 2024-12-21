import { store } from "../../Store/store"
import { confirm } from "../Common/Confirm"
import { Icon } from "../Common/Icon"
import { CACHE_VERSION } from "../../App"

const showClearStorageConfirm = () => {
    confirm({
        title: <div>האם לאפס את האפליקציה?</div>,
        icon: <Icon icon="warning" />,
        content: <div></div>,
        okText: "איפוס",
        okType: "danger",
        cancelText: "ביטול",
        direction: "rtl",
        onOk: async () => {
            store.clearAppStorage().then(() => {
                window.location.reload()
            })
        },
        onCancel() {
            console.log("ClearStorageConfirm.onCancel: User cancelled deletion")
        },
    })
}

export default function ClearAppStorageButton() {
    return (
        <button
            className="link-text-btn"
            onClick={() => showClearStorageConfirm()}
            style={{ borderRadius: " 0px", borderLeft: "none" }}
        >
            v - {CACHE_VERSION}
        </button>
    )
}
