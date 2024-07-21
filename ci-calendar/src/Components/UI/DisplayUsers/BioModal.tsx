import { useState } from 'react';
import { Button, Typography, Modal, Image } from 'antd';
import { DbTeacher } from '../../../util/interfaces';
const { Title, Text } = Typography;

interface BioModalProps {
    teacher: DbTeacher
}

export default function BioModal({ teacher }: BioModalProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const imgComponent = teacher.img ? (
        <Image alt="example" src={teacher.img} key={teacher.img} width={340} height={340} style={{ objectFit: "cover", borderRadius: "5%" }} />
    ) : (
        ""
    );

    return (
        <>
            <label className="bio-modal-label" onClick={showModal} style={{ color: 'blue', textDecoration: 'underline', border: 'none', }}>
                {teacher.fullName}
            </label>

            <Modal open={isModalOpen} onOk={handleOk} onCancel={handleCancel} footer={null}>
                <div className="flex flex-col justify-center items-center w-full ">
                    <Title level={3}>{teacher.fullName}</Title>
                    {imgComponent}
                    <Text className="m-10">{teacher.bio}</Text>
                    {teacher.pageUrl && (
                        <Button
                            className="mt-5 w-full"
                            key={teacher.pageUrl}
                            type="default"
                            href={teacher.pageUrl}
                            target="_blank"
                        >
                            {teacher.pageTitle}
                        </Button>
                    )}
                </div>
            </Modal>
        </>
    );
};

