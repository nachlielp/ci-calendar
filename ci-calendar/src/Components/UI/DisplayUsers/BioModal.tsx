import { useState } from 'react';
import { Button, Typography, Modal, Image } from 'antd';
import { DbUser } from '../../../util/interfaces';
const { Title, Text } = Typography;

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
        <Image alt="example" src={user.img} key={user.img} width={340} height={340} style={{ objectFit: "cover", borderRadius: "5%" }} />
    ) : (
        ""
    );

    return (
        <>
            <Button type="link" onClick={showModal} style={{ color: 'blue', textDecoration: 'underline', border: 'none', padding: "2px" }}>
                {user.fullName}
            </Button>

            <Modal open={isModalOpen} onOk={handleOk} onCancel={handleCancel} footer={null}>
                <div className="flex flex-col justify-center items-center w-full ">
                    <Title level={3}>{user.fullName}</Title>
                    {imgComponent}
                    <Text className="m-10">{user.bio}</Text>
                    {user.pageUrl?.link && (
                        <Button
                            className="mt-5 w-full"
                            key={user.pageUrl.link}
                            type="default"
                            href={user.pageUrl.link}
                            target="_blank"
                        >
                            {user.pageUrl.title}
                        </Button>
                    )}
                    {/* <Card
                        className=" mt-6  w-full"
                        hoverable
                        style={{ width: 340 }}
                        cover={imgComponent}
                    >
                    </Card> */}
                </div>
            </Modal>
        </>
    );
};

