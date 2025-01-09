import { useState } from "react"
// import { Modal } from "../Common/Modal"
import { UserBio } from "../../util/interfaces"
import BioCard from "./BioCard"
import '../../styles/bio-modal.scss'
import Modal from "antd/es/modal"
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
                width={350}
                style={{ width: "300px" }}
                onCancel={handleCancel}
                footer={null}
            >
                <BioCard teacher={teacher} />
            </Modal>
        </>
    )
}
