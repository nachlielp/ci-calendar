import { useEffect, useState } from "react"
import { Modal } from "antd"
import { utilService } from "../../../util/utilService"

const MESSAGE_TITLE = "התראות מושבתות"

const MESSAGE_BROWSER =
    "כדי להפעיל את ההתראות, אנא הפעילו את ההתראות בדפדפן האינטרנט שלכם"

const MESSAGE_PWA = "כדי להפעיל את ההתראות, אנא הפעילו את ההתראות באפליקציה "

export default function NotificationsBlockedModal({
    anchorElement,
}: {
    anchorElement: React.ReactNode
}) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [message, setMessage] = useState("")

    useEffect(() => {
        setMessage(utilService.isPWA() ? MESSAGE_PWA : MESSAGE_BROWSER)
    }, [])

    const showModal = () => {
        setIsModalOpen(true)
    }

    const handleOk = () => {
        setIsModalOpen(false)
    }

    const handleCancel = () => {
        setIsModalOpen(false)
    }

    return (
        <>
            <div onClick={showModal}>{anchorElement}</div>
            <Modal
                title={MESSAGE_TITLE}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                footer={null}
            >
                <p>{message}</p>
            </Modal>
        </>
    )
}
