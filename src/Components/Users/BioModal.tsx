import { useState } from "react"
import { Modal } from "../Common/Modal"
import { UserBio } from "../../util/interfaces"
import BioCard from "./BioCard"
import "../../styles/bio-modal.css"
interface BioModalProps {
    teacher: UserBio
}

export default function BioModal({ teacher }: BioModalProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const showModal = () => {
        setIsModalOpen(true)
    }

    const handleCancel = () => {
        setIsModalOpen(false)
    }

    return (
        <>
            <label
                className="bio-modal-label"
                onClick={showModal}
                // style={{
                //     color: "blue",
                //     textDecoration: "underline",
                //     border: "none",
                //     cursor: "pointer",
                // }}
            >
                {teacher.bio_name}
            </label>

            <Modal
                open={isModalOpen}
                // onOk={handleOk}
                onCancel={handleCancel}
            >
                <BioCard teacher={teacher} />
            </Modal>
        </>
    )
}
