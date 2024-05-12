import { useState } from 'react';
import { Button, Card, Modal } from 'antd';
import { DbUser } from '../../../util/interfaces';
import Meta from 'antd/es/card/Meta';

interface BioModalProps {
    user: DbUser
}

export default function BioModal({ user }: BioModalProps) {
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

    const imgComponent = user.img ? (
        <img alt="example" src={user.img} key={user.img} />
    ) : (
        ""
    );

    return (
        <>
            <Button type="link" onClick={showModal} style={{ color: 'blue', textDecoration: 'underline', border: 'none', padding: "2px" }}>
                {user.fullName}
            </Button>

            <Modal open={isModalOpen} onOk={handleOk} onCancel={handleCancel} footer={null}>
                <div className="flex justify-center items-center w-full ">
                    <Card
                        className=" mt-6  w-full"
                        hoverable
                        style={{ width: 340 }}
                        cover={imgComponent}
                    >
                        <Meta title={user.fullName} description={user.bio} />
                        {user.pageUrl?.link && (
                            <Button
                                className="mt-5 w-full"
                                key={user.pageUrl.link}
                                type="default"
                                href={user.pageUrl.link}
                                target="_blank"
                            >
                                דף פרופיל
                            </Button>
                        )}
                    </Card>
                </div>
            </Modal>
        </>
    );
};

