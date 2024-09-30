import { Card, Image } from "antd"
import { Typography } from "antd"
import { Icon } from "../Other/Icon"
import { useUser } from "../../../context/UserContext"
const { Text } = Typography

function BioCard() {
    const { user } = useUser()
    if (!user) throw new Error("BioCard: No user found")

    return (
        <>
            {user && (
                <Card hoverable className="bio-card">
                    <div className="bio-card-content">
                        <label className="bio-card-title">
                            {user.fullName}
                        </label>

                        {user?.img && (
                            <Image
                                alt="example"
                                src={user.img}
                                key={user.img}
                                preview={false}
                                width={250}
                                height={250}
                                className="bio-card-img"
                            />
                        )}
                        {user.pageUrl && (
                            <a
                                className="teacher-page-link"
                                key={user.pageUrl}
                                href={user.pageUrl}
                                target="_blank"
                            >
                                {user.pageTitle || "דף פרופיל"}
                                <Icon
                                    icon="openInNew"
                                    className="event-link-icon"
                                />
                            </a>
                        )}

                        <hr className="bio-card-hr" />
                        <label className="bio-card-subtitle">
                            אודות {user.fullName}
                        </label>
                        <Text>{user.bio}</Text>
                    </div>
                </Card>
            )}
        </>
    )
}

export default BioCard
