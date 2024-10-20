import Modal from "antd/es/modal"
import SecondaryButton from "./SecondaryButton"
import { useState } from "react"
import { Icon } from "./Icon"
import Select from "antd/es/select"

const notificationOptions = [
    { label: "1 שעה", value: "1" },
    { label: "2 שעות", value: "2" },
    { label: "4 שעות", value: "4" },
    { label: "יום", value: "24" },
    { label: "יומיים", value: "48" },
]

//TODO WIP
export default function CIEventNotificationModal() {
    const [isOpen, setIsOpen] = useState(false)

    const openModal = () => {
        setIsOpen(true)
    }

    const modalFooter = (
        <article className="modal-footer">
            <SecondaryButton
                label="שמירת התראה"
                successLabel="שמירת התראה"
                icon={"check"}
                successIcon={"check"}
                callback={() => setIsOpen(false)}
            />

            <SecondaryButton
                label="ביטול התראה"
                successLabel="ביטול התראה"
                icon={"close"}
                successIcon={"close"}
                callback={() => setIsOpen(false)}
            />
        </article>
    )

    return (
        <section className="notification-modal-button">
            <SecondaryButton
                label=""
                successLabel=""
                icon={"notifications_active"}
                successIcon={"notifications_active"}
                callback={openModal}
            />
            <Modal
                open={isOpen}
                onCancel={() => setIsOpen(false)}
                footer={modalFooter}
                className="set-notification-timeframe-modal"
            >
                <section className="notification-modal-container">
                    <Icon icon="notifications" className="notification-icon" />
                    <label className="label-text">אני רוצה לקבל התראה</label>
                    <Select
                        options={notificationOptions}
                        defaultValue="1"
                        style={{ width: "120px" }}
                    />
                    <label className="label-text">לפני הארוע</label>
                </section>
            </Modal>
        </section>
    )
}
