import { appHeaderVM as vm } from "../Layout/AppHeaderVM"
import Spin from "antd/es/spin"
import { observer } from "mobx-react-lite"
import '../../styles/request-permission-modal.scss'
import Modal from "antd/es/modal"
const RequestPermissionModal = () => {
    const requestPermission = async () => {
        vm.setLoading()
        const permission = await Notification.requestPermission()
        if (permission === "granted") {
            vm.setFCMToken()
        }
    }
    return (
        <Modal
            open={vm.showRequestPermissionModal}
            closable={false}
            footer={null}
        >
            <section className="request-permission-modal">
                <label className="title">אישור קבלת התראות</label>
                <label className="description">
                    על מנת שתוכלו ליצור תזכורות צריך לאשר קבלת התראות
                </label>
                <section className="content-container">
                    {vm.isLoading && (
                        <section className="loading-container">
                            <Spin size="large" />
                        </section>
                    )}
                    {!vm.isLoading && (
                        <article className="buttons-container">
                            <button
                                onClick={requestPermission}
                                className="general-action-btn large-btn black-btn"
                            >
                                אישור
                            </button>
                            <button
                                onClick={vm.setDontReceiveNotifications}
                                className="text-btn large-btn "
                            >
                                דחיה
                            </button>
                        </article>
                    )}
                </section>
            </section>
        </Modal>
    )
}

export default observer(RequestPermissionModal)
