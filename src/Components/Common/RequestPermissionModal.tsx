import Modal from "antd/es/modal"
import { appHeaderVM as vm } from "../Layout/AppHeaderVM"

const RequestPermissionModal = () => {
    const requestPermission = async () => {
        const permission = await Notification.requestPermission()
        if (permission === "granted") {
            vm.setFCMToken()
        }
    }
    return (
        <Modal
            open={vm.showRequestPermissionModal}
            footer={null}
            closable={false}
        >
            <section className="request-permission-modal">
                <label className="title">אישור קבלת התראות</label>
                <label className="description">
                    על מנת שתוכלו ליצור תזכורות צריך לאשר קבלת התראות
                </label>
                <article className="buttons">
                    <button
                        onClick={requestPermission}
                        className="general-action-btn large-btn black-btn"
                    >
                        אישור
                    </button>
                    <button
                        onClick={vm.setDontReceiveNotifications}
                        className="general-action-btn large-btn red-btn"
                    >
                        דחיה
                    </button>
                </article>
            </section>
        </Modal>
    )
}

export default RequestPermissionModal
